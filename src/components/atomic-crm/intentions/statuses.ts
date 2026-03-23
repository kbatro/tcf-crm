import type { ConfigurationContextValue } from "../root/ConfigurationContext";
import type { Intention } from "../types";

export type IntentionsByStatus = Record<Intention["status"], Intention[]>;

export const getIntentionsByStatus = (
  unorderedIntentions: Intention[],
  intentionStatuses: ConfigurationContextValue["intentionStatuses"],
) => {
  if (!intentionStatuses) return {};
  const intentionsByStatus: Record<Intention["status"], Intention[]> =
    unorderedIntentions.reduce(
      (acc, intention) => {
        // if intention has a status that does not exist in configuration, assign it to the first status
        const status = intentionStatuses.find(
          (s) => s.value === intention.status,
        )
          ? intention.status
          : intentionStatuses[0].value;
        acc[status].push(intention);
        return acc;
      },
      intentionStatuses.reduce(
        (obj, status) => ({ ...obj, [status.value]: [] }),
        {} as Record<Intention["status"], Intention[]>,
      ),
    );
  // order each column by index
  intentionStatuses.forEach((status) => {
    intentionsByStatus[status.value] = intentionsByStatus[status.value].sort(
      (recordA: Intention, recordB: Intention) =>
        recordA.index - recordB.index,
    );
  });
  return intentionsByStatus;
};
