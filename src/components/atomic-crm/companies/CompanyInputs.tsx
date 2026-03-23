import { useState } from "react";
import { required, useRecordContext, useTranslate } from "ra-core";
import { useFormContext } from "react-hook-form";
import {
  Plus,
  Globe,
  Phone,
  Linkedin,
  MapPin,
  FileText,
  Mail,
  MoreHorizontal,
} from "lucide-react";

import { TextInput } from "@/components/admin/text-input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import ImageEditorField from "../misc/ImageEditorField";
import { isLinkedinUrl } from "../misc/isLinkedInUrl";
import type { Company } from "../types";

const isUrl = (url: string) => {
  if (!url) return;
  const UrlRegex = new RegExp(
    /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/i,
  );
  if (!UrlRegex.test(url)) {
    return {
      message: "crm.validation.invalid_url",
      args: { _: "Must be a valid URL" },
    };
  }
};

const attributeTypes = [
  { id: "website", label: "Website", icon: Globe },
  { id: "phone", label: "Phone", icon: Phone },
  { id: "address", label: "Address", icon: MapPin },
  { id: "email", label: "Email", icon: Mail },
  { id: "description", label: "Description", icon: FileText },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
  { id: "other", label: "Other", icon: MoreHorizontal },
] as const;

type AttributeType = (typeof attributeTypes)[number]["id"];

export const CompanyInputs = () => {
  const { getValues } = useFormContext();
  const translate = useTranslate();
  const record = useRecordContext<Company>();

  const [visibleAttributes, setVisibleAttributes] = useState<AttributeType[]>(
    () => {
      const attrs: AttributeType[] = [];
      const values = getValues();
      if (values.website) attrs.push("website");
      if (values.phone_number) attrs.push("phone");
      if (
        values.address ||
        values.city ||
        values.zipcode ||
        values.state_abbr ||
        values.country
      )
        attrs.push("address");
      if (values.email) attrs.push("email");
      if (values.description) attrs.push("description");
      if (values.linkedin_url) attrs.push("linkedin");
      if (values.context_links?.length > 0) attrs.push("other");
      return attrs;
    },
  );

  const addAttribute = (type: AttributeType) => {
    if (visibleAttributes.includes(type)) return;
    setVisibleAttributes((prev) => [...prev, type]);
  };

  const availableAttributes = attributeTypes.filter(
    (attr) => !visibleAttributes.includes(attr.id),
  );

  return (
    <div className="flex flex-col gap-4 p-1">
      <div className="flex gap-4 items-start">
        <ImageEditorField
          source="logo"
          type="avatar"
          width={60}
          height={60}
          emptyText={record?.name?.charAt(0)}
          linkPosition="bottom"
        />
        <TextInput
          source="name"
          className="w-full h-fit"
          validate={required()}
          helperText={false}
          placeholder={translate("resources.companies.fields.name", {
            _: "Group name",
          })}
        />
      </div>

      {visibleAttributes.includes("website") && <WebsiteInput />}
      {visibleAttributes.includes("phone") && <PhoneInput />}
      {visibleAttributes.includes("address") && <AddressInputs />}
      {visibleAttributes.includes("email") && <EmailInput />}
      {visibleAttributes.includes("description") && <DescriptionInput />}
      {visibleAttributes.includes("linkedin") && <LinkedInInput />}
      {visibleAttributes.includes("other") && <OtherInput />}

      {availableAttributes.length > 0 && (
        <AddAttributeButton
          availableAttributes={availableAttributes}
          onAdd={addAttribute}
        />
      )}
    </div>
  );
};

const AddAttributeButton = ({
  availableAttributes,
  onAdd,
}: {
  availableAttributes: ReadonlyArray<{
    id: AttributeType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
  onAdd: (type: AttributeType) => void;
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
        {availableAttributes.map((attr) => (
          <DropdownMenuItem key={attr.id} onClick={() => onAdd(attr.id)}>
            <attr.icon className="size-4" />
            {attr.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const WebsiteInput = () => {
  return <TextInput source="website" helperText={false} validate={isUrl} />;
};

const PhoneInput = () => {
  return <TextInput source="phone_number" helperText={false} />;
};

const AddressInputs = () => {
  return (
    <div className="flex flex-col gap-4">
      <TextInput source="address" helperText={false} />
      <div className="flex gap-4">
        <TextInput source="city" helperText={false} />
        <TextInput source="state_abbr" helperText={false} />
      </div>
      <div className="flex gap-4">
        <TextInput source="zipcode" helperText={false} />
        <TextInput source="country" helperText={false} />
      </div>
    </div>
  );
};

const EmailInput = () => {
  return <TextInput source="email" helperText={false} />;
};

const DescriptionInput = () => {
  return <TextInput source="description" multiline helperText={false} />;
};

const LinkedInInput = () => {
  return (
    <TextInput
      source="linkedin_url"
      helperText={false}
      validate={isLinkedinUrl}
    />
  );
};

const OtherInput = () => {
  return <TextInput source="other_info" helperText={false} />;
};
