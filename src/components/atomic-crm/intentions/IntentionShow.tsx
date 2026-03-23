import { useMutation } from "@tanstack/react-query";
import { isValid } from "date-fns";
import { Archive, ArchiveRestore } from "lucide-react";
import {
  ShowBase,
  useDataProvider,
  useNotify,
  useRecordContext,
  useRedirect,
  useRefresh,
  useTranslate,
  useUpdate,
} from "ra-core";
import { DeleteButton } from "@/components/admin/delete-button";
import { EditButton } from "@/components/admin/edit-button";
import { ReferenceArrayField } from "@/components/admin/reference-array-field";
import { ReferenceField } from "@/components/admin/reference-field";
import { ReferenceManyField } from "@/components/admin/reference-many-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

import { CompanyAvatar } from "../companies/CompanyAvatar";
import { NoteCreate } from "../notes/NoteCreate";
import { NotesIterator } from "../notes/NotesIterator";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Intention } from "../types";
import { ContactList } from "./ContactList";
import { findIntentionLabel, formatISODateString } from "./intentionUtils";

export const IntentionShow = ({
  open,
  id,
}: {
  open: boolean;
  id?: string;
}) => {
  const redirect = useRedirect();
  const handleClose = () => {
    redirect("list", "intentions");
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="lg:max-w-4xl p-4 overflow-y-auto max-h-9/10 top-1/20 translate-y-0">
        {id ? (
          <ShowBase id={id}>
            <IntentionShowContent />
          </ShowBase>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

const IntentionShowContent = () => {
  const translate = useTranslate();
  const { intentionStatuses, intentionTypes, currency } =
    useConfigurationContext();
  const record = useRecordContext<Intention>();
  if (!record) return null;

  return (
    <>
      <div className="space-y-2">
        {record.archived_at ? <ArchivedTitle /> : null}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <ReferenceField
                source="target_id"
                reference="companies"
                link="show"
              >
                <CompanyAvatar />
              </ReferenceField>
              <h2 className="text-2xl font-semibold">{record.name}</h2>
            </div>
            <div
              className={`flex gap-2 ${record.archived_at ? "" : "pr-12"}`}
            >
              {record.archived_at ? (
                <>
                  <UnarchiveButton record={record} />
                  <DeleteButton />
                </>
              ) : (
                <>
                  <ArchiveButton record={record} />
                  <EditButton />
                </>
              )}
            </div>
          </div>

          <div className="flex gap-8 m-4">
            <div className="flex flex-col mr-10">
              <span className="text-xs text-muted-foreground tracking-wide">
                {translate(
                  "resources.intentions.fields.expected_closing_date",
                )}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {isValid(new Date(record.expected_closing_date))
                    ? formatISODateString(record.expected_closing_date)
                    : translate("resources.intentions.invalid_date")}
                </span>
                {new Date(record.expected_closing_date) < new Date() ? (
                  <Badge variant="destructive">
                    {translate("crm.common.past")}
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col mr-10">
              <span className="text-xs text-muted-foreground tracking-wide">
                {translate("resources.intentions.fields.amount")}
              </span>
              <span className="text-sm">
                {record.amount.toLocaleString("en-US", {
                  notation: "compact",
                  style: "currency",
                  currency,
                  currencyDisplay: "narrowSymbol",
                  minimumSignificantDigits: 3,
                })}
              </span>
            </div>

            {record.type && (
              <div className="flex flex-col mr-10">
                <span className="text-xs text-muted-foreground tracking-wide">
                  {translate("resources.intentions.fields.type")}
                </span>
                <span className="text-sm">
                  {intentionTypes.find((c) => c.value === record.type)
                    ?.label ?? record.type}
                </span>
              </div>
            )}

            <div className="flex flex-col mr-10">
              <span className="text-xs text-muted-foreground tracking-wide">
                {translate("resources.intentions.fields.status")}
              </span>
              <span className="text-sm">
                {findIntentionLabel(intentionStatuses, record.status)}
              </span>
            </div>
          </div>

          {!!record.contact_ids?.length && (
            <div className="m-4">
              <div className="flex flex-col min-h-12 mr-10">
                <span className="text-xs text-muted-foreground tracking-wide">
                  {translate("resources.intentions.fields.contact_ids")}
                </span>
                <ReferenceArrayField
                  source="contact_ids"
                  reference="contacts_summary"
                >
                  <ContactList />
                </ReferenceArrayField>
              </div>
            </div>
          )}

          {record.description && (
            <div className="m-4 whitespace-pre-line">
              <span className="text-xs text-muted-foreground tracking-wide">
                {translate("resources.intentions.fields.description")}
              </span>
              <p className="text-sm leading-6">{record.description}</p>
            </div>
          )}

          <div className="m-4">
            <Separator className="mb-4" />
            <ReferenceManyField
              target="target_id"
              reference="notes"
              sort={{ field: "created_at", order: "DESC" }}
              filter={{ target_type: "intention" }}
              empty={<NoteCreate reference={"intentions"} />}
            >
              <NotesIterator reference="intentions" />
            </ReferenceManyField>
          </div>
        </div>
      </div>
    </>
  );
};

const ArchivedTitle = () => {
  const translate = useTranslate();
  return (
    <div className="bg-orange-500 px-6 py-4">
      <h3 className="text-lg font-bold text-white">
        {translate("resources.intentions.archived.title")}
      </h3>
    </div>
  );
};

const ArchiveButton = ({ record }: { record: Intention }) => {
  const translate = useTranslate();
  const [update] = useUpdate();
  const redirect = useRedirect();
  const notify = useNotify();
  const refresh = useRefresh();
  const handleClick = () => {
    update(
      "intentions",
      {
        id: record.id,
        data: { archived_at: new Date().toISOString() },
        previousData: record,
      },
      {
        onSuccess: () => {
          redirect("list", "intentions");
          notify("resources.intentions.archived.success", {
            type: "info",
            undoable: false,
          });
          refresh();
        },
        onError: () => {
          notify("resources.intentions.archived.error", {
            type: "error",
          });
        },
      },
    );
  };

  return (
    <Button
      onClick={handleClick}
      size="sm"
      variant="outline"
      className="flex items-center gap-2 h-9"
    >
      <Archive className="w-4 h-4" />
      {translate("resources.intentions.archived.action")}
    </Button>
  );
};

const UnarchiveButton = ({ record }: { record: Intention }) => {
  const translate = useTranslate();
  const dataProvider = useDataProvider();
  const redirect = useRedirect();
  const notify = useNotify();
  const refresh = useRefresh();

  const { mutate } = useMutation({
    mutationFn: () => dataProvider.unarchiveIntention(record),
    onSuccess: () => {
      redirect("list", "intentions");
      notify("resources.intentions.unarchived.success", {
        type: "info",
        undoable: false,
      });
      refresh();
    },
    onError: () => {
      notify("resources.intentions.unarchived.error", {
        type: "error",
      });
    },
  });

  const handleClick = () => {
    mutate();
  };

  return (
    <Button
      onClick={handleClick}
      size="sm"
      variant="outline"
      className="flex items-center gap-2 h-9"
    >
      <ArchiveRestore className="w-4 h-4" />
      {translate("resources.intentions.unarchived.action")}
    </Button>
  );
};
