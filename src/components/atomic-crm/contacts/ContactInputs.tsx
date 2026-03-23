import { email, required, useTranslate } from "ra-core";
import { useState, type FocusEvent, type ClipboardEventHandler } from "react";
import { useFormContext } from "react-hook-form";
import { Plus, X, Mail, Phone, Linkedin, Globe, MapPin } from "lucide-react";

import { ReferenceInput } from "@/components/admin/reference-input";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ArrayInput } from "@/components/admin/array-input";
import { SimpleFormIterator } from "@/components/admin/simple-form-iterator";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { translatePersonalInfoTypeLabel } from "./contactGender";
import { Avatar } from "./Avatar";
import { AutocompleteCompanyInput } from "../companies/AutocompleteCompanyInput.tsx";

const channelTypes = [
  { id: "email", label: "Email", icon: Mail },
  { id: "phone", label: "Phone", icon: Phone },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
] as const;

type ChannelType = (typeof channelTypes)[number]["id"];

export const ContactInputs = () => {
  const { getValues, setValue } = useFormContext();
  const translate = useTranslate();

  const [visibleChannels, setVisibleChannels] = useState<ChannelType[]>(() => {
    const channels: ChannelType[] = [];
    const values = getValues();
    if (values.email_jsonb?.length > 0) channels.push("email");
    if (values.phone_jsonb?.length > 0) channels.push("phone");
    if (values.linkedin_url) channels.push("linkedin");
    return channels;
  });

  const addChannel = (type: ChannelType) => {
    if (visibleChannels.includes(type)) return;

    setVisibleChannels((prev) => [...prev, type]);

    if (type === "email") {
      const current = getValues("email_jsonb") ?? [];
      if (current.length === 0) {
        setValue("email_jsonb", [{ email: "", type: "Work" }]);
      }
    }

    if (type === "phone") {
      const current = getValues("phone_jsonb") ?? [];
      if (current.length === 0) {
        setValue("phone_jsonb", [{ number: "", type: "Work" }]);
      }
    }

    if (type === "linkedin") {
      setValue("linkedin_url", getValues("linkedin_url") ?? "");
    }
  };

  const availableChannels = channelTypes.filter(
    (ch) => !visibleChannels.includes(ch.id),
  );

  return (
    <div className="flex flex-col gap-4 p-1">
      <div className="flex gap-4 items-start">
        <Avatar />
        <div className="flex flex-col gap-4 flex-1">
          <div className="flex gap-4">
            <TextInput
              source="first_name"
              validate={required()}
              helperText={false}
            />
            <TextInput
              source="last_name"
              validate={required()}
              helperText={false}
            />
          </div>
          <ReferenceInput
            source="company_id"
            reference="companies"
            perPage={10}
          >
            <AutocompleteCompanyInput label="resources.contacts.fields.company_id" />
          </ReferenceInput>
        </div>
      </div>

      {visibleChannels.includes("email") && <EmailChannelInputs />}
      {visibleChannels.includes("phone") && <PhoneChannelInputs />}
      {visibleChannels.includes("linkedin") && <LinkedInChannelInput />}

      {availableChannels.length > 0 && (
        <AddChannelButton
          availableChannels={availableChannels}
          onAdd={addChannel}
        />
      )}
    </div>
  );
};

const AddChannelButton = ({
  availableChannels,
  onAdd,
}: {
  availableChannels: ReadonlyArray<{
    id: ChannelType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
  onAdd: (type: ChannelType) => void;
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" type="button" className="self-start">
          <Plus />
          Add info
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {availableChannels.map((channel) => (
          <DropdownMenuItem
            key={channel.id}
            onClick={() => onAdd(channel.id)}
          >
            <channel.icon className="size-4" />
            {channel.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const EmailChannelInputs = () => {
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
  );
};

const PhoneChannelInputs = () => {
  const translate = useTranslate();

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

  return (
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
  );
};

const LinkedInChannelInput = () => {
  return <TextInput source="linkedin_url" helperText={false} />;
};
