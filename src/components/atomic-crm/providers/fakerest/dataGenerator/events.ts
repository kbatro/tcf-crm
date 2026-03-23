import type { CrmEvent } from "../../../types";
import type { Db } from "./types";

export const generateEvents = (db: Db): CrmEvent[] => {
  const events: CrmEvent[] = [];
  let nextId = 0;

  // Events for companies (groups)
  for (const company of db.companies) {
    events.push({
      id: nextId++,
      action: "created",
      target_type: "group",
      target_id: company.id,
      actor_id: company.actor_id,
      timestamp: company.created_at,
      metadata: {},
    });
  }

  // Events for contacts
  for (const contact of db.contacts) {
    events.push({
      id: nextId++,
      action: "created",
      target_type: "contact",
      target_id: contact.id,
      actor_id: contact.actor_id,
      timestamp: contact.first_seen,
      metadata: {},
    });
  }

  // Events for intentions
  for (const intention of db.intentions) {
    events.push({
      id: nextId++,
      action: "created",
      target_type: "intention",
      target_id: intention.id,
      actor_id: intention.actor_id,
      timestamp: intention.created_at,
      metadata: {},
    });
  }

  // Events for notes
  for (const note of db.notes) {
    events.push({
      id: nextId++,
      action: "noted",
      target_type: note.target_type,
      target_id: note.target_id,
      actor_id: note.actor_id,
      timestamp: note.created_at,
      metadata: { note_id: note.id },
    });
  }

  // Sort by timestamp descending (newest first)
  events.sort(
    (a, b) => new Date(b.timestamp).valueOf() - new Date(a.timestamp).valueOf(),
  );

  return events;
};
