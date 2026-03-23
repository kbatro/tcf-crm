import type { Identifier } from "ra-core";
import { useGetManyAggregate } from "ra-core";

export const useGetActorName = (
  id?: Identifier,
  options?: { enabled?: boolean },
) => {
  const enabled = options?.enabled ?? id != null;
  const { data, error } = useGetManyAggregate(
    "actors",
    { ids: id !== null ? [id] : undefined },
    { enabled },
  );

  const actor = data?.[0];
  if (actor) return `${actor.first_name} ${actor.last_name}`;
  if (error) return "??";
  return "";
};
