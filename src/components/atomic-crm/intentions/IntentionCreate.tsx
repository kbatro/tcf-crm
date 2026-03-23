import { useQueryClient } from "@tanstack/react-query";
import {
  Form,
  useDataProvider,
  useGetIdentity,
  useListContext,
  useRedirect,
  type GetListResult,
} from "ra-core";
import { Create } from "@/components/admin/create";
import { SaveButton } from "@/components/admin/form";
import { FormToolbar } from "@/components/admin/simple-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";

import type { Intention } from "../types";
import { IntentionInputs } from "./IntentionInputs";

export const IntentionCreate = ({ open }: { open: boolean }) => {
  const redirect = useRedirect();
  const dataProvider = useDataProvider();
  const { data: allIntentions } = useListContext<Intention>();

  const handleClose = () => {
    redirect("/intentions");
  };

  const queryClient = useQueryClient();

  const onSuccess = async (intention: Intention) => {
    if (!allIntentions) {
      redirect("/intentions");
      return;
    }
    const intentions = allIntentions.filter(
      (i: Intention) => i.status === intention.status && i.id !== intention.id,
    );
    await Promise.all(
      intentions.map(async (oldIntention) =>
        dataProvider.update("intentions", {
          id: oldIntention.id,
          data: { index: oldIntention.index + 1 },
          previousData: oldIntention,
        }),
      ),
    );
    const intentionsById = intentions.reduce(
      (acc, i) => ({
        ...acc,
        [i.id]: { ...i, index: i.index + 1 },
      }),
      {} as { [key: string]: Intention },
    );
    const now = Date.now();
    queryClient.setQueriesData<GetListResult | undefined>(
      { queryKey: ["intentions", "getList"] },
      (res) => {
        if (!res) return res;
        return {
          ...res,
          data: res.data.map(
            (i: Intention) => intentionsById[i.id] || i,
          ),
        };
      },
      { updatedAt: now },
    );
    redirect("/intentions");
  };

  const { identity } = useGetIdentity();

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="lg:max-w-4xl overflow-y-auto max-h-9/10 top-1/20 translate-y-0">
        <Create resource="intentions" mutationOptions={{ onSuccess }}>
          <Form
            defaultValues={{
              actor_id: identity?.id,
              index: 0,
            }}
          >
            <IntentionInputs />
            <FormToolbar>
              <SaveButton />
            </FormToolbar>
          </Form>
        </Create>
      </DialogContent>
    </Dialog>
  );
};
