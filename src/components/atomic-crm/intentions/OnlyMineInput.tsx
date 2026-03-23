import { useGetIdentity, useListFilterContext, useTranslate } from "ra-core";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const OnlyMineInput = (_: { alwaysOn: boolean; source: string }) => {
  const translate = useTranslate();
  const { filterValues, displayedFilters, setFilters } = useListFilterContext();
  const { identity } = useGetIdentity();

  const handleChange = () => {
    const newFilterValues = { ...filterValues };
    if (typeof filterValues.actor_id !== "undefined") {
      delete newFilterValues.actor_id;
    } else {
      newFilterValues.actor_id = identity && identity?.id;
    }
    setFilters(newFilterValues, displayedFilters);
  };
  return (
    <div className="mt-auto pb-2.25">
      <div className="flex items-center space-x-2">
        <Switch
          id="only-mine"
          checked={typeof filterValues.actor_id !== "undefined"}
          onCheckedChange={handleChange}
        />
        <Label htmlFor="only-mine">
          {translate("resources.intentions.filters.only_mine", {
            _: "Only efforts I manage",
          })}
        </Label>
      </div>
    </div>
  );
};
