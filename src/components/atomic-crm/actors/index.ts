import type { Actor } from "../types";
import { ActorsCreate } from "./ActorsCreate";
import { ActorsEdit } from "./ActorsEdit";
import { ActorsList } from "./ActorsList";

export default {
  list: ActorsList,
  create: ActorsCreate,
  edit: ActorsEdit,
  recordRepresentation: (record: Actor) =>
    `${record.first_name} ${record.last_name}`,
};
