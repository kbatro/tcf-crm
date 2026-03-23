import { Draggable } from "@hello-pangea/dnd";
import { useRedirect, RecordContextProvider } from "ra-core";
import { ReferenceField } from "@/components/admin/reference-field";
import { NumberField } from "@/components/admin/number-field";
import { SelectField } from "@/components/admin/select-field";
import { Card, CardContent } from "@/components/ui/card";

import { CompanyAvatar } from "../companies/CompanyAvatar";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Intention } from "../types";

export const IntentionCard = ({
  intention,
  index,
}: {
  intention: Intention;
  index: number;
}) => {
  if (!intention) return null;

  return (
    <Draggable draggableId={String(intention.id)} index={index}>
      {(provided, snapshot) => (
        <IntentionCardContent
          provided={provided}
          snapshot={snapshot}
          intention={intention}
        />
      )}
    </Draggable>
  );
};

export const IntentionCardContent = ({
  provided,
  snapshot,
  intention,
}: {
  provided?: any;
  snapshot?: any;
  intention: Intention;
}) => {
  const { intentionTypes, currency } = useConfigurationContext();
  const redirect = useRedirect();
  const handleClick = () => {
    redirect(
      `/intentions/${intention.id}/show`,
      undefined,
      undefined,
      undefined,
      {
        _scrollToTop: false,
      },
    );
  };

  return (
    <div
      className="cursor-pointer"
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      ref={provided?.innerRef}
      onClick={handleClick}
    >
      <RecordContextProvider value={intention}>
        <Card
          className={`py-3 transition-all duration-200 ${
            snapshot?.isDragging
              ? "opacity-90 transform rotate-1 shadow-lg"
              : "shadow-sm hover:shadow-md"
          }`}
        >
          <CardContent className="px-3 flex flex-col">
            <div className="flex-1 flex">
              <p className="flex-1 text-sm font-medium mb-2">
                <ReferenceField
                  source="target_id"
                  reference="companies"
                  link={false}
                />
                {" - "}
                {intention.name}
              </p>
              <ReferenceField
                source="target_id"
                reference="companies"
                link={false}
              >
                <CompanyAvatar width={20} height={20} />
              </ReferenceField>
            </div>
            <p className="text-xs text-muted-foreground">
              <NumberField
                source="amount"
                options={{
                  notation: "compact",
                  style: "currency",
                  currency,
                  currencyDisplay: "narrowSymbol",
                  minimumSignificantDigits: 3,
                }}
              />
              {intention.type && ", "}
              <SelectField
                source="type"
                choices={intentionTypes}
                optionText="label"
                optionValue="value"
              />
            </p>
          </CardContent>
        </Card>
      </RecordContextProvider>
    </div>
  );
};
