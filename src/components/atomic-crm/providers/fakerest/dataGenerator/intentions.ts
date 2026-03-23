import { add } from "date-fns";
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
    company.nb_intentions++;
    const lowercaseName = lorem.words();
    const created_at = randomDate(new Date(company.created_at)).toISOString();

    const expected_closing_date = randomDate(
      new Date(created_at),
      add(new Date(created_at), { months: 6 }),
    )
      .toISOString()
      .split("T")[0];

    return {
      id,
      name: lowercaseName[0].toUpperCase() + lowercaseName.slice(1),
      target_type: "group",
      target_id: company.id,
      contact_ids: random
        .arrayElements(
          db.contacts.filter((contact) => contact.company_id === company.id),
          datatype.number({ min: 1, max: 3 }),
        )
        .map((contact) => contact.id),
      type: random.arrayElement(defaultIntentionTypes).value,
      status: random.arrayElement(defaultIntentionStatuses).value,
      description: lorem.paragraphs(datatype.number({ min: 1, max: 4 })),
      amount: datatype.number(1000) * 100,
      created_at,
      updated_at: randomDate(new Date(created_at)).toISOString(),
      expected_closing_date,
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
