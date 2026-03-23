import {
  withLifecycleCallbacks,
  type CreateParams,
  type DataProvider,
  type Identifier,
  type ResourceCallbacks,
  type UpdateParams,
} from "ra-core";
import fakeRestDataProvider from "ra-data-fakerest";

import type {
  Company,
  Contact,
  Note,
  Intention,
  Actor,
  ActorFormData,
  SignUpData,
  Task,
} from "../../types";
import type { ConfigurationContextValue } from "../../root/ConfigurationContext";
import { getCompanyAvatar } from "../commons/getCompanyAvatar";
import { getContactAvatar } from "../commons/getContactAvatar";
import { mergeContacts } from "../commons/mergeContacts";
import type { CrmDataProvider } from "../types";
import {
  authProvider as defaultAuthProvider,
  USER_STORAGE_KEY,
} from "./authProvider";
import generateData from "./dataGenerator";
import type { Db } from "./dataGenerator/types";
import { withSupabaseFilterAdapter } from "./internal/supabaseAdapter";

const TASK_MARKED_AS_DONE = "TASK_MARKED_AS_DONE";
const TASK_MARKED_AS_UNDONE = "TASK_MARKED_AS_UNDONE";
const TASK_DONE_NOT_CHANGED = "TASK_DONE_NOT_CHANGED";

const processGroupLogo = async (params: any) => {
  let logo = params.data.logo;

  if (typeof logo !== "object" || logo === null || !logo.src) {
    logo = await getCompanyAvatar(params.data);
  } else if (logo.rawFile instanceof File) {
    const base64Logo = await convertFileToBase64(logo);
    logo = { src: base64Logo, title: logo.title };
  }

  return {
    ...params,
    data: {
      ...params.data,
      logo,
    },
  };
};

async function processContactAvatar(
  params: UpdateParams<Contact>,
): Promise<UpdateParams<Contact>>;

async function processContactAvatar(
  params: CreateParams<Contact>,
): Promise<CreateParams<Contact>>;

async function processContactAvatar(
  params: CreateParams<Contact> | UpdateParams<Contact>,
): Promise<CreateParams<Contact> | UpdateParams<Contact>> {
  const { data } = params;
  if (data.avatar?.src || !data.email_jsonb || !data.email_jsonb.length) {
    return params;
  }
  const avatarUrl = await getContactAvatar(data);

  const newData = { ...data, avatar: { src: avatarUrl || undefined } };

  return { ...params, data: newData };
}

async function fetchAndUpdateCompanyData(
  params: UpdateParams<Contact>,
  dataProvider: DataProvider,
): Promise<UpdateParams<Contact>>;

async function fetchAndUpdateCompanyData(
  params: CreateParams<Contact>,
  dataProvider: DataProvider,
): Promise<CreateParams<Contact>>;

async function fetchAndUpdateCompanyData(
  params: CreateParams<Contact> | UpdateParams<Contact>,
  dataProvider: DataProvider,
): Promise<CreateParams<Contact> | UpdateParams<Contact>> {
  const { data } = params;
  const newData = { ...data };

  if (!newData.company_id) {
    return params;
  }

  const { data: company } = await dataProvider.getOne("companies", {
    id: newData.company_id,
  });

  if (!company) {
    return params;
  }

  newData.company_name = company.name;
  return { ...params, data: newData };
}

export interface CreateFakeRestDataProviderOptions {
  db?: Db;
  latency?: number;
  authProvider?: Pick<typeof defaultAuthProvider, "getIdentity">;
}

const processConfigLogo = async (logo: any): Promise<string> => {
  if (typeof logo === "string") return logo;
  if (logo?.rawFile instanceof File) {
    return (await convertFileToBase64(logo)) as string;
  }
  return logo?.src ?? "";
};

const preserveAttachmentMimeType = <
  NoteType extends { attachments?: Array<{ rawFile?: File; type?: string }> },
>(
  note: NoteType,
): NoteType => ({
  ...note,
  attachments: (note.attachments ?? []).map((attachment) => ({
    ...attachment,
    type: attachment.type ?? attachment.rawFile?.type,
  })),
});

export const createDataProvider = ({
  db = generateData(),
  latency = 300,
  authProvider,
}: CreateFakeRestDataProviderOptions = {}): CrmDataProvider => {
  const baseDataProvider = fakeRestDataProvider(db, true, latency);
  let taskUpdateType = TASK_DONE_NOT_CHANGED;
  const getIdentity = async () =>
    authProvider?.getIdentity?.() ?? defaultAuthProvider.getIdentity?.();

  const updateCompany = async (
    companyId: Identifier,
    updateFn: (company: Company) => Partial<Company>,
  ) => {
    const { data: company } = await dataProvider.getOne<Company>("companies", {
      id: companyId,
    });

    return await dataProvider.update("companies", {
      id: companyId,
      data: {
        ...updateFn(company),
      },
      previousData: company,
    });
  };

  const dataProviderWithCustomMethod: CrmDataProvider = {
    ...baseDataProvider,
    async getList(resource: string, params: any) {
      return baseDataProvider.getList(resource, params);
    },
    unarchiveIntention: async (intention: Intention) => {
      const { data: intentions } = await baseDataProvider.getList<Intention>(
        "intentions",
        {
          filter: { status: intention.status },
          pagination: { page: 1, perPage: 1000 },
          sort: { field: "index", order: "ASC" },
        },
      );

      const updatedIntentions = intentions.map((i, index) => ({
        ...i,
        index: i.id === intention.id ? 0 : index + 1,
        archived_at: i.id === intention.id ? null : i.archived_at,
      }));

      return await Promise.all(
        updatedIntentions.map((updatedIntention) =>
          dataProvider.update("intentions", {
            id: updatedIntention.id,
            data: updatedIntention,
            previousData: intentions.find(
              (i) => i.id === updatedIntention.id,
            ),
          }),
        ),
      );
    },
    signUp: async ({
      email,
      password,
      first_name,
      last_name,
    }: SignUpData): Promise<{
      id: string;
      email: string;
      password: string;
    }> => {
      const user = await baseDataProvider.create("actors", {
        data: {
          email,
          first_name,
          last_name,
        },
      });

      return {
        ...user.data,
        password,
      };
    },
    actorsCreate: async ({ ...data }: ActorFormData): Promise<Actor> => {
      const response = await dataProvider.create("actors", {
        data: {
          ...data,
          password: "new_password",
        },
      });

      return response.data;
    },
    actorsUpdate: async (
      id: Identifier,
      data: Partial<Omit<ActorFormData, "password">>,
    ): Promise<Actor> => {
      const { data: previousData } = await dataProvider.getOne<Actor>("actors", {
        id,
      });

      if (!previousData) {
        throw new Error("User not found");
      }

      const { data: actor } = await dataProvider.update<Actor>("actors", {
        id,
        data,
        previousData,
      });
      return { ...actor, user_id: actor.id.toString() };
    },
    isInitialized: async (): Promise<boolean> => {
      const actors = await dataProvider.getList<Actor>("actors", {
        filter: {},
        pagination: { page: 1, perPage: 1 },
        sort: { field: "id", order: "ASC" },
      });
      if (actors.data.length === 0) {
        return false;
      }
      return true;
    },
    updatePassword: async (id: Identifier): Promise<true> => {
      const currentUser = await getIdentity();
      if (!currentUser) {
        throw new Error("User not found");
      }
      const { data: previousData } = await dataProvider.getOne<Actor>("actors", {
        id: currentUser.id,
      });

      if (!previousData) {
        throw new Error("User not found");
      }

      await dataProvider.update("actors", {
        id,
        data: {
          password: "demo_newPassword",
        },
        previousData,
      });

      return true;
    },
    mergeContacts: async (sourceId: Identifier, targetId: Identifier) => {
      return mergeContacts(sourceId, targetId, baseDataProvider);
    },
    getConfiguration: async (): Promise<ConfigurationContextValue> => {
      const { data } = await baseDataProvider.getOne("configuration", {
        id: 1,
      });
      return (data?.config as ConfigurationContextValue) ?? {};
    },
    updateConfiguration: async (
      config: ConfigurationContextValue,
    ): Promise<ConfigurationContextValue> => {
      const { data: prev } = await baseDataProvider.getOne("configuration", {
        id: 1,
      });
      await baseDataProvider.update("configuration", {
        id: 1,
        data: { config },
        previousData: prev,
      });
      return config;
    },
  };

  const dataProvider = withLifecycleCallbacks(
    withSupabaseFilterAdapter(dataProviderWithCustomMethod),
    [
      {
        resource: "configuration",
        beforeUpdate: async (params) => {
          const config = params.data.config;
          if (config) {
            config.lightModeLogo = await processConfigLogo(
              config.lightModeLogo,
            );
            config.darkModeLogo = await processConfigLogo(config.darkModeLogo);
          }
          return params;
        },
      },
      {
        resource: "actors",
        beforeCreate: async (params) => {
          const { data } = params;
          if (data.administrator == null) {
            data.administrator = false;
          }
          return params;
        },
        afterSave: async (data) => {
          const currentUser = await getIdentity();
          if (currentUser?.id === data.id) {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
          }
          return data;
        },
        beforeDelete: async (params) => {
          if (params.meta?.identity?.id == null) {
            throw new Error("Identity MUST be set in meta");
          }

          const newSaleId = params.meta.identity.id as Identifier;

          const [companies, contacts, notes, intentions] = await Promise.all([
            dataProvider.getList("companies", {
              filter: { actor_id: params.id },
              pagination: {
                page: 1,
                perPage: 10_000,
              },
              sort: { field: "id", order: "ASC" },
            }),
            dataProvider.getList("contacts", {
              filter: { actor_id: params.id },
              pagination: {
                page: 1,
                perPage: 10_000,
              },
              sort: { field: "id", order: "ASC" },
            }),
            dataProvider.getList("notes", {
              filter: { actor_id: params.id },
              pagination: {
                page: 1,
                perPage: 10_000,
              },
              sort: { field: "id", order: "ASC" },
            }),
            dataProvider.getList("intentions", {
              filter: { actor_id: params.id },
              pagination: {
                page: 1,
                perPage: 10_000,
              },
              sort: { field: "id", order: "ASC" },
            }),
          ]);

          await Promise.all([
            dataProvider.updateMany("companies", {
              ids: companies.data.map((company) => company.id),
              data: {
                actor_id: newSaleId,
              },
            }),
            dataProvider.updateMany("contacts", {
              ids: contacts.data.map((contact) => contact.id),
              data: {
                actor_id: newSaleId,
              },
            }),
            dataProvider.updateMany("notes", {
              ids: notes.data.map((note) => note.id),
              data: {
                actor_id: newSaleId,
              },
            }),
            dataProvider.updateMany("intentions", {
              ids: intentions.data.map((intention) => intention.id),
              data: {
                actor_id: newSaleId,
              },
            }),
          ]);

          return params;
        },
      } satisfies ResourceCallbacks<Actor>,
      {
        resource: "contacts",
        beforeCreate: async (createParams, dataProvider) => {
          const params = {
            ...createParams,
            data: {
              ...createParams.data,
              first_seen:
                createParams.data.first_seen ?? new Date().toISOString(),
              last_seen:
                createParams.data.last_seen ?? new Date().toISOString(),
            },
          };
          const newParams = await processContactAvatar(params);
          return fetchAndUpdateCompanyData(newParams, dataProvider);
        },
        afterCreate: async (result) => {
          const companyId = result.data.company_id;
          if (companyId != null) {
            await updateCompany(companyId, (company) => ({
              nb_contacts: (company.nb_contacts ?? 0) + 1,
            }));
          }

          return result;
        },
        beforeUpdate: async (params) => {
          const newParams = await processContactAvatar(params);
          return fetchAndUpdateCompanyData(newParams, dataProvider);
        },
        afterDelete: async (result) => {
          const companyId = result.data.company_id;
          if (companyId != null) {
            await updateCompany(companyId, (company) => ({
              nb_contacts: (company.nb_contacts ?? 1) - 1,
            }));
          }

          return result;
        },
      } satisfies ResourceCallbacks<Contact>,
      {
        resource: "tasks",
        afterCreate: async (result, dataProvider) => {
          const { contact_id } = result.data;
          const { data: contact } = await dataProvider.getOne("contacts", {
            id: contact_id,
          });
          await dataProvider.update("contacts", {
            id: contact_id,
            data: {
              nb_tasks: (contact.nb_tasks ?? 0) + 1,
            },
            previousData: contact,
          });
          return result;
        },
        beforeUpdate: async (params) => {
          const { data, previousData } = params;
          if (previousData.done_date !== data.done_date) {
            taskUpdateType = data.done_date
              ? TASK_MARKED_AS_DONE
              : TASK_MARKED_AS_UNDONE;
          } else {
            taskUpdateType = TASK_DONE_NOT_CHANGED;
          }
          return params;
        },
        afterUpdate: async (result, dataProvider) => {
          const { contact_id } = result.data;
          const { data: contact } = await dataProvider.getOne("contacts", {
            id: contact_id,
          });
          if (taskUpdateType !== TASK_DONE_NOT_CHANGED) {
            await dataProvider.update("contacts", {
              id: contact_id,
              data: {
                nb_tasks:
                  taskUpdateType === TASK_MARKED_AS_DONE
                    ? (contact.nb_tasks ?? 0) - 1
                    : (contact.nb_tasks ?? 0) + 1,
              },
              previousData: contact,
            });
          }
          return result;
        },
        afterDelete: async (result, dataProvider) => {
          const { contact_id } = result.data;
          const { data: contact } = await dataProvider.getOne("contacts", {
            id: contact_id,
          });
          await dataProvider.update("contacts", {
            id: contact_id,
            data: {
              nb_tasks: (contact.nb_tasks ?? 0) - 1,
            },
            previousData: contact,
          });
          return result;
        },
      } satisfies ResourceCallbacks<Task>,
      {
        resource: "companies",
        beforeCreate: async (params) => {
          const createParams = await processGroupLogo(params);

          return {
            ...createParams,
            data: {
              ...createParams.data,
              created_at: new Date().toISOString(),
            },
          };
        },
        beforeUpdate: async (params) => {
          return await processGroupLogo(params);
        },
        afterUpdate: async (result, dataProvider) => {
          const { id, name } = result.data;
          const { data: contacts } = await dataProvider.getList("contacts", {
            filter: { company_id: id },
            pagination: { page: 1, perPage: 1000 },
            sort: { field: "id", order: "ASC" },
          });

          const contactIds = contacts.map((contact) => contact.id);
          await dataProvider.updateMany("contacts", {
            ids: contactIds,
            data: { company_name: name },
          });
          return result;
        },
      } satisfies ResourceCallbacks<Company>,
      {
        resource: "intentions",
        beforeCreate: async (params) => {
          return {
            ...params,
            data: {
              ...params.data,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          };
        },
        afterCreate: async (result) => {
          return result;
        },
        beforeUpdate: async (params) => {
          return {
            ...params,
            data: {
              ...params.data,
              updated_at: new Date().toISOString(),
            },
          };
        },
        afterDelete: async (result) => {
          return result;
        },
      } satisfies ResourceCallbacks<Intention>,
      {
        resource: "notes",
        beforeSave: async (params) => preserveAttachmentMimeType(params),
      } satisfies ResourceCallbacks<Note>,
    ],
  ) as CrmDataProvider;

  return dataProvider;
};

export const dataProvider = createDataProvider();

const convertFileToBase64 = (file: { rawFile: Blob }): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file.rawFile);
  });
