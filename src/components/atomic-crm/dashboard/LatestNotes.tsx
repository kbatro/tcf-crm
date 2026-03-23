import { formatDistance } from "date-fns";
import { FileText } from "lucide-react";
import { useGetIdentity, useGetList, useTranslate } from "ra-core";
import { ReferenceField } from "@/components/admin/reference-field";
import { TextField } from "@/components/admin/text-field";
import { Card, CardContent } from "@/components/ui/card";

import type { Contact, Note } from "../types";

export const LatestNotes = () => {
  const { identity } = useGetIdentity();
  const translate = useTranslate();
  const { data: notesData, isPending: notesLoading } = useGetList<Note>(
    "notes",
    {
      pagination: { page: 1, perPage: 5 },
      sort: { field: "created_at", order: "DESC" },
      filter: { actor_id: identity?.id },
    },
    { enabled: Number.isInteger(identity?.id) },
  );

  if (notesLoading) {
    return null;
  }
  if (!notesData) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center mb-4">
        <div className="ml-8 mr-8 flex">
          <FileText className="text-muted-foreground w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold text-muted-foreground">
          {translate("crm.dashboard.latest_notes")}
        </h2>
      </div>
      <Card>
        <CardContent>
          {notesData.map((note) => (
            <div
              id={`note_${note.id}`}
              key={`note_${note.id}`}
              className="mb-8"
            >
              <div className="text-sm text-muted-foreground">
                {note.target_type === "intention" ? (
                  <IntentionRef note={note} />
                ) : (
                  <ContactRef note={note} />
                )}
                {", "}
                {translate("crm.dashboard.latest_notes_added_ago", {
                  timeAgo: formatDistance(note.created_at, new Date(), {
                    addSuffix: true,
                  }),
                })}
              </div>
              <div>
                <p className="text-sm line-clamp-3 overflow-hidden">
                  {note.text}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

const IntentionRef = ({ note }: { note: Note }) => {
  const translate = useTranslate();
  return (
    <>
      {translate("resources.intentions.forcedCaseName", {
        _: "Intention",
      })}{" "}
      <ReferenceField
        record={note}
        source="target_id"
        reference="intentions"
        link="show"
      >
        <TextField source="name" />
      </ReferenceField>
    </>
  );
};

const ContactRef = ({ note }: { note: Note }) => {
  const translate = useTranslate();
  return (
    <>
      {translate("resources.contacts.forcedCaseName")}{" "}
      <ReferenceField<Note, Contact>
        record={note}
        source="target_id"
        reference="contacts"
        link="show"
      />
    </>
  );
};
