import {
  type Identifier,
  useDataProvider,
  useGetIdentity,
  useGetOne,
  useGetRecordRepresentation,
  useNotify,
  useRedirect,
  useTranslate,
  useUpdate,
} from "ra-core";
import { CreateSheet } from "../misc/CreateSheet";
import { NoteInputs } from "./NoteInputs";
import { getCurrentDate } from "./utils";

export interface NoteCreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact_id?: Identifier;
}

export const NoteCreateSheet = ({
  open,
  onOpenChange,
  contact_id,
}: NoteCreateSheetProps) => {
  const { identity } = useGetIdentity();

  const selectContact = contact_id == null;
  const { data: contact } = useGetOne(
    "contacts",
    { id: contact_id! },
    { enabled: !selectContact },
  );
  const [update] = useUpdate();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const redirect = useRedirect();
  const translate = useTranslate();
  const getContactRepresentation = useGetRecordRepresentation("contacts");

  if (!identity) return null;

  const handleSuccess = async (data: any) => {
    const referenceRecordId = data.target_id;
    if (!referenceRecordId) return;
    const { data: contact } = await dataProvider.getOne("contacts", {
      id: referenceRecordId,
    });
    if (!contact) return;
    update("contacts", {
      id: referenceRecordId as unknown as Identifier,
      data: { last_seen: new Date().toISOString(), status: data.status },
      previousData: contact,
    });
    notify("resources.notes.added", {
      messageArgs: {
        _: "Note added",
      },
    });
    redirect("show", "contacts", referenceRecordId);
    onOpenChange(false);
  };

  return (
    <CreateSheet
      resource="notes"
      title={
        <h1 className="text-xl font-semibold truncate pr-10">
          {!selectContact
            ? translate("resources.notes.sheet.create_for", {
                name: getContactRepresentation(contact!),
              })
            : translate("resources.notes.sheet.create")}
        </h1>
      }
      redirect={false}
      defaultValues={{ actor_id: identity?.id }}
      transform={(data: any) => ({
        ...data,
        target_type: "contact",
        target_id: contact_id ?? data.target_id,
        actor_id: identity.id,
        created_at: new Date(
          data.created_at || getCurrentDate(),
        ).toISOString(),
      })}
      mutationOptions={{
        onSuccess: handleSuccess,
      }}
      open={open}
      onOpenChange={onOpenChange}
    >
      <NoteInputs
        showStatus
        reference="contacts"
        selectReference={selectContact}
      />
    </CreateSheet>
  );
};
