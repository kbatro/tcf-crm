import { useGetIdentity, useGetOne, useTranslate } from "ra-core";
import { Link } from "react-router";

import { ReferenceField } from "@/components/admin/reference-field";
import { TextField } from "@/components/admin/text-field";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar } from "../contacts/Avatar";
import { CompanyAvatar } from "../companies/CompanyAvatar";
import { RelativeDate } from "../misc/RelativeDate";
import { useGetActorName } from "../actors/useGetActorName";
import type { CrmEvent, Note } from "../types";
import { useActivityLogContext } from "./ActivityLogContext";
import { ActivityLogNote } from "./ActivityLogNote";

type EventItemProps = {
  event: CrmEvent;
};

export function EventItem({ event }: EventItemProps) {
  if (event.action === "created" && event.target_type === "group") {
    return <GroupCreatedEvent event={event} />;
  }

  if (event.action === "created" && event.target_type === "contact") {
    return <ContactCreatedEvent event={event} />;
  }

  if (event.action === "created" && event.target_type === "intention") {
    return <IntentionCreatedEvent event={event} />;
  }

  if (event.action === "noted") {
    return <NoteCreatedEvent event={event} />;
  }

  return null;
}

function useIsCurrentUser(actorId?: CrmEvent["actor_id"]) {
  const { identity, isPending } = useGetIdentity();
  const isCurrentUser = !isPending && identity?.id === actorId;
  return isCurrentUser;
}

function GroupCreatedEvent({ event }: EventItemProps) {
  const context = useActivityLogContext();
  const translate = useTranslate();
  const isCurrentUser = useIsCurrentUser(event.actor_id);
  const actorName = useGetActorName(event.actor_id, {
    enabled: !isCurrentUser,
  });

  return (
    <div className="p-0">
      <div className="flex flex-row gap-2 items-start w-full">
        <ReferenceField
          source="target_id"
          reference="companies"
          record={event}
          link={false}
        >
          <CompanyAvatar width={20} height={20} />
        </ReferenceField>

        <span className="text-muted-foreground text-sm flex-grow">
          {translate(
            isCurrentUser
              ? "crm.activity.you_added_company"
              : "crm.activity.added_company",
            { name: actorName },
          )}{" "}
          <ReferenceField
            source="target_id"
            reference="companies"
            record={event}
            link="show"
          />
          {context === "all" && (
            <>
              {" "}
              <RelativeDate date={event.timestamp} />
            </>
          )}
        </span>
        {context === "company" && (
          <span className="text-muted-foreground text-sm">
            <RelativeDate date={event.timestamp} />
          </span>
        )}
      </div>
    </div>
  );
}

function ContactCreatedEvent({ event }: EventItemProps) {
  const context = useActivityLogContext();
  const translate = useTranslate();
  const isCurrentUser = useIsCurrentUser(event.actor_id);
  const actorName = useGetActorName(event.actor_id, {
    enabled: !isCurrentUser,
  });

  return (
    <div className="p-0">
      <div className="flex flex-row gap-2 items-start w-full">
        <ReferenceField
          source="target_id"
          reference="contacts"
          record={event}
          link={false}
        >
          <Avatar width={20} height={20} />
        </ReferenceField>
        <span className="text-muted-foreground text-sm flex-grow">
          {translate(
            isCurrentUser
              ? "crm.activity.you_added_contact"
              : "crm.activity.added_contact",
            { name: actorName },
          )}{" "}
          <ReferenceField
            source="target_id"
            reference="contacts"
            record={event}
            link="show"
          >
            <TextField source="first_name" />{" "}
            <TextField source="last_name" />
          </ReferenceField>
          {context !== "company" && (
            <>
              {" "}
              <RelativeDate date={event.timestamp} />
            </>
          )}
        </span>
        {context === "company" && (
          <span className="text-muted-foreground text-sm">
            <RelativeDate date={event.timestamp} />
          </span>
        )}
      </div>
    </div>
  );
}

function IntentionCreatedEvent({ event }: EventItemProps) {
  const context = useActivityLogContext();
  const isMobile = useIsMobile();
  const translate = useTranslate();
  const isCurrentUser = useIsCurrentUser(event.actor_id);
  const actorName = useGetActorName(event.actor_id, {
    enabled: !isCurrentUser,
  });

  return (
    <div className="p-0">
      <div className="flex flex-row gap-2 items-start w-full">
        <div className="w-[20px] h-[20px] bg-gray-300 rounded-full shrink-0" />
        <span className="text-muted-foreground text-sm flex-grow">
          {translate(
            isCurrentUser
              ? "crm.activity.you_added_intention"
              : "crm.activity.added_intention",
            { name: actorName },
          )}{" "}
          {isMobile ? (
            <ReferenceField
              source="target_id"
              reference="intentions"
              record={event}
              link={false}
            />
          ) : (
            <ReferenceField
              source="target_id"
              reference="intentions"
              record={event}
              link="show"
            />
          )}{" "}
          {context !== "company" && (
            <RelativeDate date={event.timestamp} />
          )}
        </span>
        {context === "company" && (
          <span className="text-muted-foreground text-sm">
            <RelativeDate date={event.timestamp} />
          </span>
        )}
      </div>
    </div>
  );
}

function NoteCreatedEvent({ event }: EventItemProps) {
  const context = useActivityLogContext();
  const isMobile = useIsMobile();
  const translate = useTranslate();
  const { identity } = useGetIdentity();
  const isCurrentUser = event.actor_id === identity?.id;
  const actorName = useGetActorName(event.actor_id, {
    enabled: !isCurrentUser,
  });

  // Fetch the note to get its text
  const noteId = event.metadata?.note_id as number | undefined;
  const { data: note } = useGetOne<Note>(
    "notes",
    { id: noteId! },
    { enabled: noteId != null },
  );

  if (event.target_type === "contact") {
    const link = isMobile
      ? `/contacts/${event.target_id}/notes`
      : `/contacts/${event.target_id}/show`;
    return (
      <ActivityLogNote
        header={
          <div className="flex items-start gap-2 w-full">
            <ReferenceField
              source="target_id"
              reference="contacts"
              record={event}
              link={false}
            >
              <Avatar width={20} height={20} />
            </ReferenceField>

            <span className="text-muted-foreground text-sm flex-grow">
              {translate(
                isCurrentUser
                  ? "crm.activity.you_added_note"
                  : "crm.activity.added_note",
                { name: actorName },
              )}{" "}
              <ReferenceField
                source="target_id"
                reference="contacts"
                record={event}
              >
                <TextField source="first_name" />{" "}
                <TextField source="last_name" />
              </ReferenceField>
              {context !== "company" && (
                <>
                  {" "}
                  <RelativeDate date={event.timestamp} />
                </>
              )}
            </span>

            {context === "company" && (
              <span className="text-muted-foreground text-sm">
                <RelativeDate date={event.timestamp} />
              </span>
            )}
          </div>
        }
        text={note?.text ?? ""}
        link={link}
      />
    );
  }

  // intention note
  return (
    <ActivityLogNote
      header={
        <div className="flex flex-row items-start gap-2 flex-grow">
          <div className="w-[20px] h-[20px] bg-gray-300 rounded-full shrink-0" />
          <span className="text-muted-foreground text-sm flex-grow">
            {translate(
              isCurrentUser
                ? "crm.activity.you_added_note_about_intention"
                : "crm.activity.added_note_about_intention",
              { name: actorName },
            )}{" "}
            <ReferenceField
              source="target_id"
              reference="intentions"
              record={event}
              link={isMobile ? false : "show"}
            />
            {context !== "company" && (
              <>
                {" "}
                <RelativeDate date={event.timestamp} />
              </>
            )}
          </span>

          {context === "company" && (
            <span className="text-muted-foreground text-sm">
              <RelativeDate date={event.timestamp} />
            </span>
          )}
        </div>
      }
      text={note?.text ?? ""}
      link={isMobile ? false : `/intentions/${event.target_id}/show`}
    />
  );
}
