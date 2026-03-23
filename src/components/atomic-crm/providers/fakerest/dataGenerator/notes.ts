import { datatype, lorem, random } from "faker/locale/en_US";

import { defaultNoteStatuses } from "../../../root/defaultConfiguration";
import type { Note } from "../../../types";
import type { Db } from "./types";
import { randomDate } from "./utils";

export const generateNotes = (db: Db): Note[] => {
  const contactNotes: Note[] = Array.from(Array(1200).keys()).map((id) => {
    const contact = random.arrayElement(db.contacts);
    const created_at = randomDate(new Date(contact.first_seen));
    contact.last_seen =
      created_at > new Date(contact.last_seen)
        ? created_at.toISOString()
        : contact.last_seen;
    return {
      id,
      target_type: "contact",
      target_id: contact.id,
      text: lorem.paragraphs(datatype.number({ min: 1, max: 4 })),
      created_at: created_at.toISOString(),
      actor_id: contact.actor_id,
      status: random.arrayElement(defaultNoteStatuses).value,
    };
  });

  const intentionNotes: Note[] = Array.from(Array(300).keys()).map((id) => {
    const intention = random.arrayElement(db.intentions);
    return {
      id: 1200 + id,
      target_type: "intention",
      target_id: intention.id,
      text: lorem.paragraphs(datatype.number({ min: 1, max: 4 })),
      created_at: randomDate(
        new Date(db.intentions[intention.id as number].created_at),
      ).toISOString(),
      actor_id: intention.actor_id,
    };
  });

  return [...contactNotes, ...intentionNotes];
};
