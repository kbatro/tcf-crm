import { DragDropContext, type OnDragEndResponder } from "@hello-pangea/dnd";
import isEqual from "lodash/isEqual";
import { useDataProvider, useListContext, type DataProvider } from "ra-core";
import { useEffect, useState } from "react";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Intention } from "../types";
import { IntentionColumn } from "./IntentionColumn";
import type { IntentionsByStatus } from "./statuses";
import { getIntentionsByStatus } from "./statuses";

export const IntentionListContent = () => {
  const { intentionStatuses } = useConfigurationContext();
  const {
    data: unorderedIntentions,
    isPending,
    refetch,
  } = useListContext<Intention>();
  const dataProvider = useDataProvider();

  const [intentionsByStatus, setIntentionsByStatus] =
    useState<IntentionsByStatus>(
      getIntentionsByStatus([], intentionStatuses),
    );

  useEffect(() => {
    if (unorderedIntentions) {
      const newIntentionsByStatus = getIntentionsByStatus(
        unorderedIntentions,
        intentionStatuses,
      );
      if (!isEqual(newIntentionsByStatus, intentionsByStatus)) {
        setIntentionsByStatus(newIntentionsByStatus);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unorderedIntentions]);

  if (isPending) return null;

  const onDragEnd: OnDragEndResponder = (result) => {
    const { destination, source } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceStatus = source.droppableId;
    const destinationStatus = destination.droppableId;
    const sourceIntention =
      intentionsByStatus[sourceStatus][source.index]!;
    const destinationIntention = intentionsByStatus[destinationStatus][
      destination.index
    ] ?? {
      status: destinationStatus,
      index: undefined,
    };

    setIntentionsByStatus(
      updateIntentionStatusLocal(
        sourceIntention,
        { status: sourceStatus, index: source.index },
        { status: destinationStatus, index: destination.index },
        intentionsByStatus,
      ),
    );

    updateIntentionStatus(
      sourceIntention,
      destinationIntention,
      dataProvider,
    ).then(() => {
      refetch();
    });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4">
        {intentionStatuses.map((status) => (
          <IntentionColumn
            status={status.value}
            intentions={intentionsByStatus[status.value]}
            key={status.value}
          />
        ))}
      </div>
    </DragDropContext>
  );
};

const updateIntentionStatusLocal = (
  sourceIntention: Intention,
  source: { status: string; index: number },
  destination: {
    status: string;
    index?: number;
  },
  intentionsByStatus: IntentionsByStatus,
) => {
  if (source.status === destination.status) {
    const column = intentionsByStatus[source.status];
    column.splice(source.index, 1);
    column.splice(destination.index ?? column.length + 1, 0, sourceIntention);
    return {
      ...intentionsByStatus,
      [destination.status]: column,
    };
  } else {
    const sourceColumn = intentionsByStatus[source.status];
    const destinationColumn = intentionsByStatus[destination.status];
    sourceColumn.splice(source.index, 1);
    destinationColumn.splice(
      destination.index ?? destinationColumn.length + 1,
      0,
      sourceIntention,
    );
    return {
      ...intentionsByStatus,
      [source.status]: sourceColumn,
      [destination.status]: destinationColumn,
    };
  }
};

const updateIntentionStatus = async (
  source: Intention,
  destination: {
    status: string;
    index?: number;
  },
  dataProvider: DataProvider,
) => {
  if (source.status === destination.status) {
    const { data: columnIntentions } = await dataProvider.getList(
      "intentions",
      {
        sort: { field: "index", order: "ASC" },
        pagination: { page: 1, perPage: 100 },
        filter: { status: source.status },
      },
    );
    const destinationIndex =
      destination.index ?? columnIntentions.length + 1;

    if (source.index > destinationIndex) {
      await Promise.all([
        ...columnIntentions
          .filter(
            (intention) =>
              intention.index >= destinationIndex &&
              intention.index < source.index,
          )
          .map((intention) =>
            dataProvider.update("intentions", {
              id: intention.id,
              data: { index: intention.index + 1 },
              previousData: intention,
            }),
          ),
        dataProvider.update("intentions", {
          id: source.id,
          data: { index: destinationIndex },
          previousData: source,
        }),
      ]);
    } else {
      await Promise.all([
        ...columnIntentions
          .filter(
            (intention) =>
              intention.index <= destinationIndex &&
              intention.index > source.index,
          )
          .map((intention) =>
            dataProvider.update("intentions", {
              id: intention.id,
              data: { index: intention.index - 1 },
              previousData: intention,
            }),
          ),
        dataProvider.update("intentions", {
          id: source.id,
          data: { index: destinationIndex },
          previousData: source,
        }),
      ]);
    }
  } else {
    const [{ data: sourceIntentions }, { data: destinationIntentions }] =
      await Promise.all([
        dataProvider.getList("intentions", {
          sort: { field: "index", order: "ASC" },
          pagination: { page: 1, perPage: 100 },
          filter: { status: source.status },
        }),
        dataProvider.getList("intentions", {
          sort: { field: "index", order: "ASC" },
          pagination: { page: 1, perPage: 100 },
          filter: { status: destination.status },
        }),
      ]);
    const destinationIndex =
      destination.index ?? destinationIntentions.length + 1;

    await Promise.all([
      ...sourceIntentions
        .filter((intention) => intention.index > source.index)
        .map((intention) =>
          dataProvider.update("intentions", {
            id: intention.id,
            data: { index: intention.index - 1 },
            previousData: intention,
          }),
        ),
      ...destinationIntentions
        .filter((intention) => intention.index >= destinationIndex)
        .map((intention) =>
          dataProvider.update("intentions", {
            id: intention.id,
            data: { index: intention.index + 1 },
            previousData: intention,
          }),
        ),
      dataProvider.update("intentions", {
        id: source.id,
        data: {
          index: destinationIndex,
          status: destination.status,
        },
        previousData: source,
      }),
    ]);
  }
};
