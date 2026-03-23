import { InfiniteListBase } from "ra-core";
import type { Identifier } from "ra-core";

import { ActivityLogContext } from "./ActivityLogContext";
import { ActivityLogIterator } from "./ActivityLogIterator";

type ActivityLogProps = {
  companyId?: Identifier;
  pageSize?: number;
  context?: "company" | "contact" | "intention" | "all";
};

export function ActivityLog({
  companyId,
  pageSize = 20,
  context = "all",
}: ActivityLogProps) {
  const filter = companyId
    ? { target_type: "group", target_id: companyId }
    : {};

  return (
    <ActivityLogContext.Provider value={context}>
      <InfiniteListBase
        resource="events"
        filter={filter}
        sort={{ field: "timestamp", order: "DESC" }}
        perPage={pageSize}
        disableSyncWithLocation
      >
        <ActivityLogIterator />
      </InfiniteListBase>
    </ActivityLogContext.Provider>
  );
}
