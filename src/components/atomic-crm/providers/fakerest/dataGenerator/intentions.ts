import { datatype, lorem, random } from "faker/locale/en_US";

import {
  defaultIntentionTypes,
  defaultIntentionStatuses,
} from "../../../root/defaultConfiguration";
import type { Intention } from "../../../types";
import type { Db } from "./types";
import { randomDate } from "./utils";

export const generateIntentions = (db: Db): Intention[] => {
  const intentions = Array.from(Array(50).keys()).map((id) => {
    const company = random.arrayElement(db.companies);
    const lowercaseName = lorem.words();
    const created_at = randomDate(new Date(company.created_at)).toISOString();

    return {
      id,
      name: lowercaseName[0].toUpperCase() + lowercaseName.slice(1),
      type: random.arrayElement(defaultIntentionTypes).value,
      status: random.arrayElement(defaultIntentionStatuses).value,
      description: lorem.paragraphs(datatype.number({ min: 1, max: 4 })),
      created_at,
      updated_at: randomDate(new Date(created_at)).toISOString(),
      actor_id: company.actor_id,
      index: 0,
    };
  });
  // compute index based on status
  defaultIntentionStatuses.forEach((status) => {
    intentions
      .filter((intention) => intention.status === status.value)
      .forEach((intention, index) => {
        intentions[intention.id].index = index;
      });
  });
  return intentions;
};
