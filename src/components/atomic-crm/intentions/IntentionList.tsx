import type { ReactNode } from "react";
import type { InputProps } from "ra-core";
import { useGetIdentity, useListContext, useTranslate } from "ra-core";
import { matchPath, useLocation } from "react-router";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { CreateButton } from "@/components/admin/create-button";
import { ExportButton } from "@/components/admin/export-button";
import { List } from "@/components/admin/list";
import { ReferenceInput } from "@/components/admin/reference-input";
import { FilterButton } from "@/components/admin/filter-form";
import { SearchInput } from "@/components/admin/search-input";
import { SelectInput } from "@/components/admin/select-input";

import { useConfigurationContext } from "../root/ConfigurationContext";
import { TopToolbar } from "../layout/TopToolbar";
import { IntentionArchivedList } from "./IntentionArchivedList";
import { IntentionCreate } from "./IntentionCreate";
import { IntentionEdit } from "./IntentionEdit";
import { IntentionEmpty } from "./IntentionEmpty";
import { IntentionListContent } from "./IntentionListContent";
import { IntentionShow } from "./IntentionShow";
import { OnlyMineInput } from "./OnlyMineInput";

const IntentionList = () => {
  const { identity } = useGetIdentity();
  const { intentionTypes } = useConfigurationContext();
  const translate = useTranslate();

  if (!identity) return null;

  const intentionFilters = [
    <SearchInput source="q" alwaysOn />,
    <ReferenceInput source="target_id" reference="companies">
      <AutocompleteInput
        label={false}
        placeholder={translate("resources.intentions.fields.target_id")}
      />
    </ReferenceInput>,
    <WrapperField source="type" label="resources.intentions.fields.type">
      <SelectInput
        source="type"
        label={false}
        emptyText="resources.intentions.fields.type"
        choices={intentionTypes}
        optionText="label"
        optionValue="value"
      />
    </WrapperField>,
    <OnlyMineInput source="actor_id" alwaysOn />,
  ];

  return (
    <List
      perPage={100}
      filter={{ "archived_at@is": null }}
      title={false}
      sort={{ field: "index", order: "DESC" }}
      filters={intentionFilters}
      actions={<IntentionActions />}
      pagination={null}
    >
      <IntentionLayout />
    </List>
  );
};

const IntentionLayout = () => {
  const location = useLocation();
  const matchCreate = matchPath("/intentions/create", location.pathname);
  const matchShow = matchPath("/intentions/:id/show", location.pathname);
  const matchEdit = matchPath("/intentions/:id", location.pathname);

  const { data, isPending, filterValues } = useListContext();
  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

  if (isPending) return null;
  if (!data?.length && !hasFilters)
    return (
      <>
        <IntentionEmpty>
          <IntentionShow open={!!matchShow} id={matchShow?.params.id} />
          <IntentionArchivedList />
        </IntentionEmpty>
      </>
    );

  return (
    <div className="w-full">
      <IntentionListContent />
      <IntentionArchivedList />
      <IntentionCreate open={!!matchCreate} />
      <IntentionEdit
        open={!!matchEdit && !matchCreate}
        id={matchEdit?.params.id}
      />
      <IntentionShow open={!!matchShow} id={matchShow?.params.id} />
    </div>
  );
};

const IntentionActions = () => (
  <TopToolbar>
    <FilterButton />
    <ExportButton />
    <CreateButton label="resources.intentions.action.new" />
  </TopToolbar>
);

const WrapperField = ({ children }: InputProps & { children: ReactNode }) =>
  children;

export default IntentionList;
