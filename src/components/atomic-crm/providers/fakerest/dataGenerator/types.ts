import type {
  Company,
  Contact,
  CrmEvent,
  Note,
  Intention,
  Actor,
  Tag,
  Task,
} from "../../../types";
import type { ConfigurationContextValue } from "../../../root/ConfigurationContext";

export interface Db {
  companies: Required<Company>[];
  contacts: Required<Contact>[];
  notes: Note[];
  intentions: Intention[];
  actors: Actor[];
  tags: Tag[];
  tasks: Task[];
  events: CrmEvent[];
  configuration: Array<{ id: number; config: ConfigurationContextValue }>;
}
