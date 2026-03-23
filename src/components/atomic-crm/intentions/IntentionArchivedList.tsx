import {
  useGetIdentity,
  useGetList,
  useLocaleState,
  useTranslate,
} from "ra-core";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

import type { Intention } from "../types";
import { IntentionCardContent } from "./IntentionCard";
import { getRelativeTimeString } from "./intentionUtils";

export const IntentionArchivedList = () => {
  const translate = useTranslate();
  const [locale = "en"] = useLocaleState();
  const { identity } = useGetIdentity();
  const {
    data: archivedLists,
    total,
    isPending,
  } = useGetList("intentions", {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: "archived_at", order: "DESC" },
    filter: { "archived_at@not.is": null },
  });
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    if (!isPending && total === 0) {
      setOpenDialog(false);
    }
  }, [isPending, total]);

  useEffect(() => {
    setOpenDialog(false);
  }, [archivedLists]);

  if (!identity || isPending || !total || !archivedLists) return null;

  const archivedListsByDate: { [date: string]: Intention[] } =
    archivedLists.reduce(
      (acc, intention) => {
        const date = new Date(intention.archived_at).toDateString();
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(intention);
        return acc;
      },
      {} as { [date: string]: Intention[] },
    );

  return (
    <div className="w-full flex flex-row items-center justify-center">
      <Button
        variant="ghost"
        onClick={() => setOpenDialog(true)}
        className="my-4"
      >
        {translate("resources.intentions.archived.view")}
      </Button>
      <Dialog open={openDialog} onOpenChange={() => setOpenDialog(false)}>
        <DialogContent className="lg:max-w-4xl overflow-y-auto max-h-9/10 top-1/20 translate-y-0">
          <DialogTitle>
            {translate("resources.intentions.archived.list_title")}
          </DialogTitle>
          <div className="flex flex-col gap-8">
            {Object.entries(archivedListsByDate).map(
              ([date, intentions]) => (
                <div key={date} className="flex flex-col gap-4">
                  <h4 className="font-bold">
                    {getRelativeTimeString(date, locale)}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    {intentions.map((intention: Intention) => (
                      <div key={intention.id}>
                        <IntentionCardContent intention={intention} />
                      </div>
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
