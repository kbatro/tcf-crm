import { useGetList, useTranslate } from "ra-core";
import { matchPath, useLocation, Link } from "react-router";
import type { ReactNode } from "react";
import { CreateButton } from "@/components/admin/create-button";
import { Progress } from "@/components/ui/progress";

import useAppBarHeight from "../misc/useAppBarHeight";
import type { Contact } from "../types";
import { IntentionCreate } from "./IntentionCreate";

export const IntentionEmpty = ({ children }: { children?: ReactNode }) => {
  const translate = useTranslate();
  const location = useLocation();
  const matchCreate = matchPath("/intentions/create", location.pathname);
  const appbarHeight = useAppBarHeight();

  const { data: contacts, isPending: contactsLoading } = useGetList<Contact>(
    "contacts",
    {
      pagination: { page: 1, perPage: 1 },
    },
  );

  if (contactsLoading) return <Progress value={50} />;

  return (
    <div
      className="flex flex-col justify-center items-center gap-12"
      style={{
        height: `calc(100dvh - ${appbarHeight}px)`,
      }}
    >
      <img
        src="./img/empty.svg"
        alt={translate("resources.intentions.empty.title")}
      />
      {contacts && contacts.length > 0 ? (
        <>
          <div className="flex flex-col items-center gap-0">
            <h3 className="text-lg font-bold">
              {translate("resources.intentions.empty.title")}
            </h3>
            <p className="text-sm text-center text-muted-foreground mb-4">
              {translate("resources.intentions.empty.description")}
            </p>
          </div>
          <div className="flex space-x-8">
            <CreateButton label="resources.intentions.action.create" />
          </div>
          <IntentionCreate open={!!matchCreate} />
          {children}
        </>
      ) : (
        <div className="flex flex-col items-center gap-0">
          <h3 className="text-lg font-bold">
            {translate("resources.intentions.empty.title")}
          </h3>
          <p className="text-sm text-center text-muted-foreground mb-4">
            {translate("resources.contacts.empty.description")}
            <br />
            <Link to="/contacts/create" className="hover:underline">
              {translate("resources.contacts.action.add_first")}
            </Link>{" "}
            {translate("resources.intentions.empty.before_create")}
          </p>
        </div>
      )}
    </div>
  );
};
