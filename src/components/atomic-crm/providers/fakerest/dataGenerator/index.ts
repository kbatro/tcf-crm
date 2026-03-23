import { generateEvents } from "./events";
import { generateGroups } from "./groups";
import { generateNotes } from "./notes";
import { generateContacts } from "./contacts";
import { generateIntentions } from "./intentions";
import { finalize } from "./finalize";
import { generateActors } from "./actors";
import { generateTags } from "./tags";
import { generateTasks } from "./tasks";
import type { Db } from "./types";

export default (): Db => {
  const db = {} as Db;
  db.actors = generateActors(db);
  db.tags = generateTags(db);
  db.companies = generateGroups(db);
  db.contacts = generateContacts(db);
  db.intentions = generateIntentions(db);
  db.notes = generateNotes(db);
  db.tasks = generateTasks(db);
  db.events = generateEvents(db);
  db.configuration = [
    {
      id: 1,
      config: {} as Db["configuration"][number]["config"],
    },
  ];
  finalize(db);

  return db;
};
