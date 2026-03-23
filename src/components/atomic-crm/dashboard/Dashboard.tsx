import { useGetList } from "ra-core";

import type { Contact, Note } from "../types";
import { DashboardActivityLog } from "./DashboardActivityLog";
import { DashboardStepper } from "./DashboardStepper";
import { IntentionsChart } from "./IntentionsChart";
import { RecentContacts } from "./HotContacts";
import { TasksList } from "./TasksList";
import { Welcome } from "./Welcome";

export const Dashboard = () => {
  const {
    data: dataContact,
    total: totalContact,
    isPending: isPendingContact,
  } = useGetList<Contact>("contacts", {
    pagination: { page: 1, perPage: 1 },
  });

  const { total: totalNotes, isPending: isPendingNotes } = useGetList<Note>(
    "notes",
    {
      pagination: { page: 1, perPage: 1 },
      filter: { target_type: "contact" },
    },
  );

  const { total: totalIntention, isPending: isPendingIntention } =
    useGetList<Contact>("intentions", {
      pagination: { page: 1, perPage: 1 },
    });

  const isPending = isPendingContact || isPendingNotes || isPendingIntention;

  if (isPending) {
    return null;
  }

  if (!totalContact) {
    return <DashboardStepper step={1} />;
  }

  if (!totalNotes) {
    return <DashboardStepper step={2} contactId={dataContact?.[0]?.id} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-1">
      <div className="md:col-span-3">
        <div className="flex flex-col gap-4">
          {import.meta.env.VITE_IS_DEMO === "true" ? <Welcome /> : null}
          <RecentContacts />
        </div>
      </div>
      <div className="md:col-span-6">
        <div className="flex flex-col gap-6">
          {totalIntention ? <IntentionsChart /> : null}
          <DashboardActivityLog />
        </div>
      </div>

      <div className="md:col-span-3">
        <TasksList />
      </div>
    </div>
  );
};
