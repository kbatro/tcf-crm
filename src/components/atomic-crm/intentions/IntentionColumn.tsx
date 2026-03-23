import { Droppable } from "@hello-pangea/dnd";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Intention } from "../types";
import { findIntentionLabel } from "./intentionUtils";
import { IntentionCard } from "./IntentionCard";

export const IntentionColumn = ({
  status,
  intentions,
}: {
  status: string;
  intentions: Intention[];
}) => {
  const { intentionStatuses } = useConfigurationContext();
  return (
    <div className="flex-1 pb-8">
      <div className="flex flex-col items-center">
        <h3 className="text-base font-medium">
          {findIntentionLabel(intentionStatuses, status)}
        </h3>
        <p className="text-sm text-muted-foreground">
          {intentions.length}
        </p>
      </div>
      <Droppable droppableId={status}>
        {(droppableProvided, snapshot) => (
          <div
            ref={droppableProvided.innerRef}
            {...droppableProvided.droppableProps}
            className={`flex flex-col rounded-2xl mt-2 gap-2 ${
              snapshot.isDraggingOver ? "bg-muted" : ""
            }`}
          >
            {intentions.map((intention, index) => (
              <IntentionCard
                key={intention.id}
                intention={intention}
                index={index}
              />
            ))}
            {droppableProvided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};
