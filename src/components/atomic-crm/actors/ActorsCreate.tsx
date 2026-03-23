import { useMutation } from "@tanstack/react-query";
import { useDataProvider, useNotify, useRedirect, useTranslate } from "ra-core";
import type { SubmitHandler } from "react-hook-form";
import { SimpleForm } from "@/components/admin/simple-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { CrmDataProvider } from "../providers/types";
import type { ActorFormData } from "../types";
import { ActorsInputs } from "./ActorsInputs";

export function ActorsCreate() {
  const dataProvider = useDataProvider<CrmDataProvider>();
  const notify = useNotify();
  const translate = useTranslate();
  const redirect = useRedirect();

  const { mutate } = useMutation({
    mutationKey: ["signup"],
    mutationFn: async (data: ActorFormData) => {
      return dataProvider.actorsCreate(data);
    },
    onSuccess: () => {
      notify("resources.actors.create.success", {
        messageArgs: {
          _: "User created. They will soon receive an email to set their password.",
        },
      });
      redirect("/actors");
    },
    onError: (error) => {
      notify(
        error.message ||
          translate("resources.actors.create.error", {
            _: "An error occurred while creating the user.",
          }),
        {
          type: "error",
        },
      );
    },
  });
  const onSubmit: SubmitHandler<ActorFormData> = async (data) => {
    mutate(data);
  };

  return (
    <div className="max-w-lg w-full mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>
            {translate("resources.actors.create.title", {
              _: "Create a new user",
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleForm onSubmit={onSubmit as SubmitHandler<any>}>
            <ActorsInputs />
          </SimpleForm>
        </CardContent>
      </Card>
    </div>
  );
}
