import {
  EditBase,
  Form,
  useEditContext,
  useNotify,
  useRecordContext,
  useRedirect,
  useTranslate,
} from "ra-core";
import { Link } from "react-router";
import { DeleteButton } from "@/components/admin/delete-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

import { FormToolbar } from "../layout/FormToolbar";
import type { Intention } from "../types";
import { IntentionInputs } from "./IntentionInputs";

export const IntentionEdit = ({
  open,
  id,
}: {
  open: boolean;
  id?: string;
}) => {
  const redirect = useRedirect();
  const notify = useNotify();

  const handleClose = () => {
    redirect("/intentions", undefined, undefined, undefined, {
      _scrollToTop: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="lg:max-w-4xl p-4 overflow-y-auto max-h-9/10 top-1/20 translate-y-0">
        {id ? (
          <EditBase
            id={id}
            mutationMode="pessimistic"
            mutationOptions={{
              onSuccess: () => {
                notify("resources.intentions.updated", {});
                redirect(
                  `/intentions/${id}/show`,
                  undefined,
                  undefined,
                  undefined,
                  {
                    _scrollToTop: false,
                  },
                );
              },
            }}
          >
            <EditHeader />
            <Form>
              <IntentionInputs />
              <FormToolbar />
            </Form>
          </EditBase>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

function EditHeader() {
  const translate = useTranslate();
  const { defaultTitle } = useEditContext<Intention>();
  const intention = useRecordContext<Intention>();
  if (!intention) {
    return null;
  }

  return (
    <DialogTitle className="pb-0">
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">{defaultTitle}</h2>
        </div>
        <div className="flex gap-2 pr-12">
          <DeleteButton />
          <Button asChild variant="outline" className="h-9">
            <Link to={`/intentions/${intention.id}/show`}>
              {translate("resources.intentions.action.back_to_intention")}
            </Link>
          </Button>
        </div>
      </div>
    </DialogTitle>
  );
}
