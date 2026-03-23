import {
  CreateBase,
  Form,
  useGetIdentity,
  useListContext,
  useNotify,
  useRecordContext,
  useResourceContext,
  useTranslate,
  useUpdate,
  type Identifier,
  type RaRecord,
} from "ra-core";
import { useFormContext } from "react-hook-form";
import { SaveButton } from "@/components/admin/form";
import { cn } from "@/lib/utils";

import { NoteInputs } from "./NoteInputs";
import { getCurrentDate } from "./utils";

export const NoteCreate = ({
  reference,
  showStatus,
  className,
}: {
  reference: "contacts" | "intentions";
  showStatus?: boolean;
  className?: string;
}) => {
  const resource = useResourceContext();
  const record = useRecordContext();
  const { identity } = useGetIdentity();

  if (!record || !identity) return null;

  return (
    <CreateBase resource={resource} redirect={false}>
      <Form>
        <div className={cn("space-y-3", className)}>
          <NoteInputs showStatus={showStatus} />
          <NoteCreateButton reference={reference} record={record} />
        </div>
      </Form>
    </CreateBase>
  );
};

const NoteCreateButton = ({
  reference,
  record,
}: {
  reference: "contacts" | "intentions";
  record: RaRecord<Identifier>;
}) => {
  const [update] = useUpdate();
  const notify = useNotify();
  const translate = useTranslate();
  const { identity } = useGetIdentity();
  const { reset } = useFormContext();
  const { refetch } = useListContext();

  if (!record || !identity) return null;

  const resetValues: {
    created_at: string;
    text: null;
    attachments: null;
    status?: string;
  } = {
    created_at: getCurrentDate(),
    text: null,
    attachments: null,
  };

  if (reference === "contacts") {
    resetValues.status = "warm";
  }

  const handleSuccess = (data: any) => {
    reset(resetValues, { keepValues: false });
    refetch();
    if (reference === "contacts") {
      update(reference, {
        id: (record && record.id) as unknown as Identifier,
        data: {
          last_seen: new Date().toISOString(),
          status: data.status,
        },
        previousData: record,
      });
    }
    notify("resources.notes.added", {
      messageArgs: {
        _: "Note added",
      },
    });
  };

  const targetType = reference === "contacts" ? "contact" : "intention";

  return (
    <div className="flex justify-end">
      <SaveButton
        type="button"
        label={translate("resources.notes.action.add_this")}
        transform={(data) => ({
          ...data,
          target_type: targetType,
          target_id: record.id,
          actor_id: identity.id,
          created_at: new Date(
            data.created_at || getCurrentDate(),
          ).toISOString(),
        })}
        mutationOptions={{
          onSuccess: handleSuccess,
        }}
      />
    </div>
  );
};
