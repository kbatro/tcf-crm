import { email, required, useTranslate } from "ra-core";
import type { FocusEvent, ClipboardEventHandler } from "react";
import { useFormContext } from "react-hook-form";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { ReferenceInput } from "@/components/admin/reference-input";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ArrayInput } from "@/components/admin/array-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";

import { isLinkedinUrl } from "../misc/isLinkedInUrl";
import {
  translatePersonalInfoTypeLabel,
} from "./contactGender";
import type { Actor } from "../types";
import { Avatar } from "./Avatar";
import { AutocompleteCompanyInput } from "../companies/AutocompleteCompanyInput.tsx";

export const ContactInputs = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col gap-2 p-1 relative md:static">
      <div className="absolute top-0 right-1 md:static">
        <Avatar />
      </div>
      <div className="flex gap-10 md:gap-6 flex-col md:flex-row">
        <div className="flex flex-col gap-10 flex-1">
          <ContactNameInputs />
          <ContactGroupInputs />
        </div>
        {isMobile ? null : (
          <Separator orientation="vertical" className="flex-shrink-0" />
        )}
        <div className="flex flex-col gap-10 flex-1">
          <ContactChannelInputs />
          <ContactAssignmentInputs />
        </div>
      </div>
    </div>
  );
};

const ContactNameInputs = () => {
  const translate = useTranslate();
  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-lg font-semibold">
        {translate("resources.contacts.field_categories.identity")}
      </h6>
      <TextInput source="first_name" validate={required()} helperText={false} />
      <TextInput source="last_name" validate={required()} helperText={false} />
    </div>
  );
};

const ContactGroupInputs = () => {
  const translate = useTranslate();
  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-lg font-semibold">
        {translate("resources.contacts.field_categories.position")}
      </h6>
      <ReferenceInput source="company_id" reference="companies" perPage={10}>
        <AutocompleteCompanyInput label="resources.contacts.fields.company_id" />
      </ReferenceInput>
    </div>
  );
};

const ContactChannelInputs = () => {
  const translate = useTranslate();
  const { getValues, setValue } = useFormContext();
  const personalInfoTypes = [
    {
      id: "Work",
      name: translatePersonalInfoTypeLabel("Work", translate),
    },
    {
      id: "Home",
      name: translatePersonalInfoTypeLabel("Home", translate),
    },
    {
      id: "Other",
      name: translatePersonalInfoTypeLabel("Other", translate),
    },
  ];

  const handleEmailChange = (emailVal: string) => {
    const { first_name, last_name } = getValues();
    if (first_name || last_name || !emailVal) return;
    const [first, last] = emailVal.split("@")[0].split(".");
    setValue("first_name", first.charAt(0).toUpperCase() + first.slice(1));
    setValue(
      "last_name",
      last ? last.charAt(0).toUpperCase() + last.slice(1) : "",
    );
  };

  const handleEmailPaste: ClipboardEventHandler<
    HTMLTextAreaElement | HTMLInputElement
  > = (e) => {
    const emailVal = e.clipboardData?.getData("text/plain");
    handleEmailChange(emailVal);
  };

  const handleEmailBlur = (
    e: FocusEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    const emailVal = e.target.value;
    handleEmailChange(emailVal);
  };

  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-lg font-semibold">
        {translate("resources.contacts.field_categories.personal_info")}
      </h6>
      <ArrayInput source="email_jsonb" helperText={false}>
        <SimpleFormIterator
          inline
          disableReordering
          disableClear
          className="[&>ul>li]:border-b-0 [&>ul>li]:pb-0"
        >
          <TextInput
            source="email"
            className="w-full"
            helperText={false}
            label={false}
            placeholder={translate("resources.contacts.fields.email")}
            validate={email()}
            onPaste={handleEmailPaste}
            onBlur={handleEmailBlur}
          />
          <SelectInput
            source="type"
            helperText={false}
            label={false}
            optionText="name"
            choices={personalInfoTypes}
            defaultValue="Work"
            className="w-24 min-w-24"
          />
        </SimpleFormIterator>
      </ArrayInput>
      <ArrayInput source="phone_jsonb" helperText={false}>
        <SimpleFormIterator
          inline
          disableReordering
          disableClear
          className="[&>ul>li]:border-b-0 [&>ul>li]:pb-0"
        >
          <TextInput
            source="number"
            className="w-full"
            helperText={false}
            label={false}
            placeholder={translate("resources.contacts.fields.phone_number")}
          />
          <SelectInput
            source="type"
            helperText={false}
            label={false}
            optionText="name"
            choices={personalInfoTypes}
            defaultValue="Work"
            className="w-24 min-w-24"
          />
        </SimpleFormIterator>
      </ArrayInput>
      <TextInput
        source="linkedin_url"
        helperText={false}
        validate={isLinkedinUrl}
      />
    </div>
  );
};

const ContactAssignmentInputs = () => {
  return (
    <div className="flex flex-col gap-4">
      <ReferenceInput
        reference="actors"
        source="actor_id"
        sort={{ field: "last_name", order: "ASC" }}
        filter={{
          "disabled@neq": true,
        }}
      >
        <SelectInput
          helperText={false}
          optionText={actorOptionRenderer}
          validate={required()}
        />
      </ReferenceInput>
    </div>
  );
};

const actorOptionRenderer = (choice: Actor) =>
  `${choice.first_name} ${choice.last_name}`;
