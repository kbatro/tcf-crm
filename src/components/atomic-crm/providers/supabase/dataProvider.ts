import { supabaseDataProvider } from "ra-supabase-core";
import {
  withLifecycleCallbacks,
  type DataProvider,
  type GetListParams,
  type Identifier,
  type ResourceCallbacks,
} from "ra-core";
import type {
  Actor,
  ActorFormData,
  Note,
  Intention,
  RAFile,
  SignUpData,
} from "../../types";
import type { ConfigurationContextValue } from "../../root/ConfigurationContext";
import { ATTACHMENTS_BUCKET } from "../commons/attachments";
import { getIsInitialized } from "./authProvider";
import { supabase } from "./supabase";

if (import.meta.env.VITE_SUPABASE_URL === undefined) {
  throw new Error("Please set the VITE_SUPABASE_URL environment variable");
}
if (import.meta.env.VITE_SB_PUBLISHABLE_KEY === undefined) {
  throw new Error(
    "Please set the VITE_SB_PUBLISHABLE_KEY environment variable",
  );
}

const baseDataProvider = supabaseDataProvider({
  instanceUrl: import.meta.env.VITE_SUPABASE_URL,
  apiKey: import.meta.env.VITE_SB_PUBLISHABLE_KEY,
  supabaseClient: supabase,
  sortOrder: "asc,desc.nullslast" as any,
});

const processGroupLogo = async (params: any) => {
  const avatar = params.data.logo;

  if (avatar?.rawFile instanceof File) {
    await uploadToBucket(avatar);
  }

  return {
    ...params,
    data: {
      ...params.data,
      logo: avatar,
    },
  };
};

const dataProviderWithCustomMethods = {
  ...baseDataProvider,
  async getList(resource: string, params: GetListParams) {
    if (resource === "companies") {
      return baseDataProvider.getList("companies_summary", params);
    }
    if (resource === "contacts") {
      return baseDataProvider.getList("contacts_summary", params);
    }
    return baseDataProvider.getList(resource, params);
  },
  async getOne(resource: string, params: any) {
    if (resource === "companies") {
      return baseDataProvider.getOne("companies_summary", params);
    }
    if (resource === "contacts") {
      return baseDataProvider.getOne("contacts_summary", params);
    }

    return baseDataProvider.getOne(resource, params);
  },

  async signUp({ email, password, first_name, last_name }: SignUpData) {
    const response = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name,
          last_name,
        },
      },
    });

    if (!response.data?.user || response.error) {
      console.error("signUp.error", response.error);
      throw new Error(response?.error?.message || "Failed to create account");
    }

    getIsInitialized._is_initialized_cache = true;

    return {
      id: response.data.user.id,
      email,
      password,
    };
  },
  async actorCreate(body: ActorFormData) {
    const { data, error } = await supabase.functions.invoke<{ data: Actor }>(
      "users",
      {
        method: "POST",
        body,
      },
    );

    if (!data || error) {
      console.error("salesCreate.error", error);
      const errorDetails = await (async () => {
        try {
          return (await error?.context?.json()) ?? {};
        } catch {
          return {};
        }
      })();
      throw new Error(errorDetails?.message || "Failed to create the user");
    }

    return data.data;
  },
  async actorUpdate(
    id: Identifier,
    data: Partial<Omit<ActorFormData, "password">>,
  ) {
    const { email, first_name, last_name, administrator, avatar, disabled } =
      data;

    const { data: updatedData, error } = await supabase.functions.invoke<{
      data: Actor;
    }>("users", {
      method: "PATCH",
      body: {
        actor_id: id,
        email,
        first_name,
        last_name,
        administrator,
        disabled,
        avatar,
      },
    });

    if (!updatedData || error) {
      console.error("actorUpdate.error", error);
      throw new Error("Failed to update account manager");
    }

    return updatedData.data;
  },
  async updatePassword(id: Identifier) {
    const { data: passwordUpdated, error } =
      await supabase.functions.invoke<boolean>("update_password", {
        method: "PATCH",
        body: {
          actor_id: id,
        },
      });

    if (!passwordUpdated || error) {
      console.error("update_password.error", error);
      throw new Error("Failed to update password");
    }

    return passwordUpdated;
  },
  async unarchiveIntention(intention: Intention) {
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
        baseDataProvider.update("intentions", {
          id: updatedIntention.id,
          data: updatedIntention,
          previousData: intentions.find((i) => i.id === updatedIntention.id),
        }),
      ),
    );
  },
  async isInitialized() {
    return getIsInitialized();
  },
  async mergeContacts(sourceId: Identifier, targetId: Identifier) {
    const { data, error } = await supabase.functions.invoke("merge_contacts", {
      method: "POST",
      body: { loserId: sourceId, winnerId: targetId },
    });

    if (error) {
      console.error("merge_contacts.error", error);
      throw new Error("Failed to merge contacts");
    }

    return data;
  },
  async getConfiguration(): Promise<ConfigurationContextValue> {
    const { data } = await baseDataProvider.getOne("configuration", { id: 1 });
    return (data?.config as ConfigurationContextValue) ?? {};
  },
  async updateConfiguration(
    config: ConfigurationContextValue,
  ): Promise<ConfigurationContextValue> {
    const { data } = await baseDataProvider.update("configuration", {
      id: 1,
      data: { config },
      previousData: { id: 1 },
    });
    return data.config as ConfigurationContextValue;
  },
} satisfies DataProvider;

export type CrmDataProvider = typeof dataProviderWithCustomMethods;

const processConfigLogo = async (logo: any): Promise<string> => {
  if (typeof logo === "string") return logo;
  if (logo?.rawFile instanceof File) {
    await uploadToBucket(logo);
    return logo.src;
  }
  return logo?.src ?? "";
};

const lifeCycleCallbacks: ResourceCallbacks[] = [
  {
    resource: "configuration",
    beforeUpdate: async (params) => {
      const config = params.data.config;
      if (config) {
        config.lightModeLogo = await processConfigLogo(config.lightModeLogo);
        config.darkModeLogo = await processConfigLogo(config.darkModeLogo);
      }
      return params;
    },
  },
  {
    resource: "notes",
    beforeSave: async (data: Note, _, __) => {
      if (data.attachments) {
        data.attachments = await Promise.all(
          data.attachments.map((fi) => uploadToBucket(fi)),
        );
      }
      return data;
    },
  },
  {
    resource: "actors",
    beforeSave: async (data: Actor, _, __) => {
      if (data.avatar) {
        await uploadToBucket(data.avatar);
      }
      return data;
    },
  },
  {
    resource: "contacts",
    beforeGetList: async (params) => {
      return applyFullTextSearch([
        "first_name",
        "last_name",
        "company_name",
        "email",
        "phone",
      ])(params);
    },
    beforeCreate: async (params) => {
      const {
        email_jsonb,
        phone_jsonb,
        linkedin_url,
        company_id,
        company_name,
        gender,
        title,
        background,
        has_newsletter,
        status,
        tags,
        nb_tasks,
        email_fts,
        phone_fts,
        ...contactData
      } = params.data;
      params.meta = {
        ...params.meta,
        _channels: { email_jsonb, phone_jsonb, linkedin_url },
        _company_id: company_id,
      };
      return { ...params, data: contactData };
    },
    afterCreate: async (result, params) => {
      const contactId = result.data.id;
      const channelData = params.meta?._channels;
      const companyId = params.meta?._company_id;

      const channels: {
        contact_id: any;
        type: string;
        value: string;
        label: string;
      }[] = [];
      if (channelData?.email_jsonb) {
        for (const e of channelData.email_jsonb) {
          if (e.email) {
            channels.push({
              contact_id: contactId,
              type: "email",
              value: e.email,
              label: e.type || "Other",
            });
          }
        }
      }
      if (channelData?.phone_jsonb) {
        for (const p of channelData.phone_jsonb) {
          if (p.number) {
            channels.push({
              contact_id: contactId,
              type: "phone",
              value: p.number,
              label: p.type || "Other",
            });
          }
        }
      }
      if (channelData?.linkedin_url) {
        channels.push({
          contact_id: contactId,
          type: "linkedin",
          value: channelData.linkedin_url,
          label: "LinkedIn",
        });
      }
      if (channels.length > 0) {
        await supabase.from("channels").insert(channels);
      }

      if (companyId) {
        await supabase
          .from("group_members")
          .insert({ group_id: companyId, contact_id: contactId });
      }

      return result;
    },
    beforeUpdate: async (params) => {
      const {
        email_jsonb,
        phone_jsonb,
        linkedin_url,
        company_id,
        company_name,
        gender,
        title,
        background,
        has_newsletter,
        status,
        tags,
        nb_tasks,
        email_fts,
        phone_fts,
        ...contactData
      } = params.data;
      params.meta = {
        ...params.meta,
        _channels: { email_jsonb, phone_jsonb, linkedin_url },
        _company_id: company_id,
      };
      return { ...params, data: contactData };
    },
    afterUpdate: async (result, params) => {
      const contactId = result.data.id;
      const channelData = params.meta?._channels;
      const companyId = params.meta?._company_id;

      // Delete existing channels and re-insert
      await supabase.from("channels").delete().eq("contact_id", contactId);

      const channels: {
        contact_id: any;
        type: string;
        value: string;
        label: string;
      }[] = [];
      if (channelData?.email_jsonb) {
        for (const e of channelData.email_jsonb) {
          if (e.email) {
            channels.push({
              contact_id: contactId,
              type: "email",
              value: e.email,
              label: e.type || "Other",
            });
          }
        }
      }
      if (channelData?.phone_jsonb) {
        for (const p of channelData.phone_jsonb) {
          if (p.number) {
            channels.push({
              contact_id: contactId,
              type: "phone",
              value: p.number,
              label: p.type || "Other",
            });
          }
        }
      }
      if (channelData?.linkedin_url) {
        channels.push({
          contact_id: contactId,
          type: "linkedin",
          value: channelData.linkedin_url,
          label: "LinkedIn",
        });
      }
      if (channels.length > 0) {
        await supabase.from("channels").insert(channels);
      }

      // Delete existing group_members and re-insert
      await supabase
        .from("group_members")
        .delete()
        .eq("contact_id", contactId);
      if (companyId) {
        await supabase
          .from("group_members")
          .insert({ group_id: companyId, contact_id: contactId });
      }

      return result;
    },
  },
  {
    resource: "companies",
    beforeGetList: async (params) => {
      return applyFullTextSearch([
        "name",
        "phone_number",
        "website",
        "zipcode",
        "city",
        "state_abbr",
      ])(params);
    },
    beforeCreate: async (params) => {
      const createParams = await processGroupLogo(params);

      return {
        ...createParams,
        data: {
          created_at: new Date().toISOString(),
          ...createParams.data,
        },
      };
    },
    beforeUpdate: async (params) => {
      return await processGroupLogo(params);
    },
  },
  {
    resource: "contacts_summary",
    beforeGetList: async (params) => {
      return applyFullTextSearch(["first_name", "last_name"])(params);
    },
  },
  {
    resource: "intentions",
    beforeGetList: async (params) => {
      return applyFullTextSearch(["name", "type", "description"])(params);
    },
  },
];

export const dataProvider = withLifecycleCallbacks(
  dataProviderWithCustomMethods,
  lifeCycleCallbacks,
) as CrmDataProvider;

const applyFullTextSearch = (columns: string[]) => (params: GetListParams) => {
  if (!params.filter?.q) {
    return params;
  }
  const { q, ...filter } = params.filter;
  return {
    ...params,
    filter: {
      ...filter,
      "@or": columns.reduce((acc, column) => {
        if (column === "email")
          return {
            ...acc,
            [`email_fts@ilike`]: q,
          };
        if (column === "phone")
          return {
            ...acc,
            [`phone_fts@ilike`]: q,
          };
        else
          return {
            ...acc,
            [`${column}@ilike`]: q,
          };
      }, {}),
    },
  };
};

const uploadToBucket = async (fi: RAFile) => {
  if (!fi.src.startsWith("blob:") && !fi.src.startsWith("data:")) {
    if (fi.path) {
      const { error } = await supabase.storage
        .from(ATTACHMENTS_BUCKET)
        .createSignedUrl(fi.path, 60);

      if (!error) {
        return fi;
      }
    }
  }

  const dataContent = fi.src
    ? await fetch(fi.src)
        .then((res) => {
          if (res.status !== 200) {
            return null;
          }
          return res.blob();
        })
        .catch(() => null)
    : fi.rawFile;

  if (dataContent == null) {
    return fi;
  }

  const file = fi.rawFile;
  const fileParts = file.name.split(".");
  const fileExt = fileParts.length > 1 ? `.${file.name.split(".").pop()}` : "";
  const fileName = `${Math.random()}${fileExt}`;
  const filePath = `${fileName}`;
  const { error: uploadError } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .upload(filePath, dataContent);

  if (uploadError) {
    console.error("uploadError", uploadError);
    throw new Error("Failed to upload attachment");
  }

  const { data } = supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .getPublicUrl(filePath);

  fi.path = filePath;
  fi.src = data.publicUrl;

  const mimeType = file.type;
  fi.type = mimeType;

  return fi;
};
