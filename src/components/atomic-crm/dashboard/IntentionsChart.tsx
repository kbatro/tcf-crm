import { ResponsiveBar } from "@nivo/bar";
import { format, startOfMonth } from "date-fns";
import { TrendingUp } from "lucide-react";
import { useGetList, useTranslate } from "ra-core";
import { memo, useMemo } from "react";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Intention } from "../types";

const sixMonthsAgo = new Date(
  new Date().setMonth(new Date().getMonth() - 6),
).toISOString();

export const IntentionsChart = memo(() => {
  const translate = useTranslate();
  const { intentionStatuses } = useConfigurationContext();

  const { data, isPending } = useGetList<Intention>("intentions", {
    pagination: { perPage: 100, page: 1 },
    sort: {
      field: "created_at",
      order: "ASC",
    },
    filter: {
      "created_at@gte": sixMonthsAgo,
    },
  });

  const months = useMemo(() => {
    if (!data) return [];
    const intentionsByMonth = data.reduce(
      (acc, intention) => {
        const month = startOfMonth(
          intention.created_at ?? new Date(),
        ).toISOString();
        if (!acc[month]) {
          acc[month] = [];
        }
        acc[month].push(intention);
        return acc;
      },
      {} as Record<string, Intention[]>,
    );

    const statusKeys = intentionStatuses.map((s) => s.value);

    return Object.keys(intentionsByMonth).map((month) => {
      const entry: Record<string, any> = { date: format(month, "MMM") };
      for (const status of statusKeys) {
        entry[status] = intentionsByMonth[month].filter(
          (i) => i.status === status,
        ).length;
      }
      return entry;
    });
  }, [data, intentionStatuses]);

  if (isPending) return null;

  const statusKeys = intentionStatuses.map((s) => s.value);
  const colors = ["#61cdbb", "#97e3d5", "#2ebca6", "#e25c3b"];

  return (
    <div className="flex flex-col">
      <div className="flex items-center mb-4">
        <div className="mr-3 flex">
          <TrendingUp className="text-muted-foreground w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold text-muted-foreground">
          {translate("crm.dashboard.intentions_chart")}
        </h2>
      </div>
      <div className="h-[400px]">
        <ResponsiveBar
          data={months}
          indexBy="date"
          keys={statusKeys}
          colors={colors.slice(0, statusKeys.length)}
          margin={{ top: 30, right: 50, bottom: 30, left: 0 }}
          padding={0.3}
          valueScale={{ type: "linear" }}
          indexScale={{ type: "band", round: true }}
          enableGridX={true}
          enableGridY={false}
          enableLabel={false}
          tooltip={({ id, value, indexValue }) => {
            const label =
              intentionStatuses.find((s) => s.value === id)?.label ?? id;
            return (
              <div className="p-2 bg-secondary rounded shadow inline-flex items-center gap-1 text-secondary-foreground">
                <strong>{indexValue}: </strong>&nbsp;{label}: {value}
              </div>
            );
          }}
          axisTop={{
            tickSize: 0,
            tickPadding: 12,
            style: {
              ticks: {
                text: { fill: "var(--color-muted-foreground)" },
              },
              legend: {
                text: { fill: "var(--color-muted-foreground)" },
              },
            },
          }}
          axisBottom={{
            legendPosition: "middle",
            legendOffset: 50,
            tickSize: 0,
            tickPadding: 12,
            style: {
              ticks: {
                text: { fill: "var(--color-muted-foreground)" },
              },
              legend: {
                text: { fill: "var(--color-muted-foreground)" },
              },
            },
          }}
          axisLeft={null}
          axisRight={{
            tickValues: 8,
            style: {
              ticks: {
                text: { fill: "var(--color-muted-foreground)" },
              },
              legend: {
                text: { fill: "var(--color-muted-foreground)" },
              },
            },
          }}
          legends={[
            {
              dataFrom: "keys",
              anchor: "top-right",
              direction: "column",
              translateX: 50,
              itemWidth: 80,
              itemHeight: 20,
              itemTextColor: "var(--color-muted-foreground)",
              data: intentionStatuses.map((s, i) => ({
                id: s.value,
                label: s.label,
                color: colors[i % colors.length],
              })),
            },
          ]}
        />
      </div>
    </div>
  );
});
