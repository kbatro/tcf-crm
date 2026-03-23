import type { Db } from "./types";

export const finalize = (db: Db) => {
  // set contact status according to the latest note targeting a contact
  db.notes
    .filter((note) => note.target_type === "contact")
    .sort(
      (a, b) =>
        new Date(a.created_at).valueOf() - new Date(b.created_at).valueOf(),
    )
    .forEach((note) => {
      db.contacts[note.target_id as number].status = note.status ?? "warm";
    });
};
