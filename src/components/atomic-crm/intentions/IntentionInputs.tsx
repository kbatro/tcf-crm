import { required } from "ra-core";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";

import { useConfigurationContext } from "../root/ConfigurationContext";

export const IntentionInputs = () => {
  return (
    <div className="flex flex-col gap-8">
      <IntentionInfoInputs />
      <IntentionMiscInputs />
    </div>
  );
};

const IntentionInfoInputs = () => {
  return (
    <div className="flex flex-col gap-4 flex-1">
      <TextInput source="name" validate={required()} helperText={false} />
      <TextInput source="description" multiline rows={3} helperText={false} />
    </div>
  );
};

const IntentionMiscInputs = () => {
  const { intentionStatuses, intentionTypes } = useConfigurationContext();
  return (
    <div className="flex flex-col gap-4 flex-1">
      <SelectInput
        source="type"
        choices={intentionTypes}
        optionText="label"
        optionValue="value"
        helperText={false}
      />
      <SelectInput
        source="status"
        choices={intentionStatuses}
        optionText="label"
        optionValue="value"
        defaultValue="entering"
        helperText={false}
        validate={required()}
      />
    </div>
  );
};
