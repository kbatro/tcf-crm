import type { Identifier, RaRecord } from "ra-core";
import type { ComponentType } from "react";

export type SignUpData = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
};

export type ActorFormData = {
  avatar?: string;
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  administrator: boolean;
  disabled: boolean;
};

export type Actor = {
  first_name: string;
  last_name: string;
  administrator: boolean;
  avatar?: RAFile;
  disabled?: boolean;
  user_id: string;
  type: string;
  created_at: string;

  /**
   * This is a copy of the user's email, to make it easier to handle by react admin
   * DO NOT UPDATE this field directly, it should be updated by the backend
   */
  email: string;

  /**
   * This is used by the fake rest provider to store the password
   * DO NOT USE this field in your code besides the fake rest provider
   * @deprecated
   */
  password?: string;
} & Pick<RaRecord, "id">;

/** @deprecated Use ActorFormData instead */
export type SalesFormData = ActorFormData;

/** @deprecated Use Actor instead */
export type Sale = Actor;

export type GroupType = {
  name: string;
  schema: Record<string, string>;
} & Pick<RaRecord, "id">;

export type Group = {
  name: string;
  avatar: RAFile;
  group_type_id?: Identifier;
  actor_id?: Identifier;
  created_at: string;
  nb_contacts?: number;
  nb_intentions?: number;
} & Pick<RaRecord, "id">;

export type GroupProperty = {
  id: number;
  group_id: Identifier;
  key: string;
  value: string;
  type: string;
};

export type GroupMember = {
  id: number;
  group_id: Identifier;
  contact_id: Identifier;
  role?: string;
  joined_at: string;
  left_at?: string;
};

/**
 * Company is a backward-compatible alias for Group.
 * The companies_summary view still returns this shape from groups + group_properties.
 */
export type Company = {
  name: string;
  logo: RAFile;
  sector: string;
  size: 1 | 10 | 50 | 250 | 500;
  linkedin_url: string;
  website: string;
  phone_number: string;
  address: string;
  zipcode: string;
  city: string;
  state_abbr: string;
  actor_id?: Identifier;
  created_at: string;
  description: string;
  revenue: string;
  tax_identifier: string;
  country: string;
  context_links?: string[];
  nb_contacts?: number;
  nb_intentions?: number;
  group_type_id?: Identifier;
} & Pick<RaRecord, "id">;

export type EmailAndType = {
  email: string;
  type: "Work" | "Home" | "Other";
};

export type PhoneNumberAndType = {
  number: string;
  type: "Work" | "Home" | "Other";
};

export type Contact = {
  first_name: string;
  last_name: string;
  title: string;
  company_id?: Identifier | null;
  email_jsonb: EmailAndType[];
  avatar?: Partial<RAFile>;
  linkedin_url?: string | null;
  first_seen: string;
  last_seen: string;
  has_newsletter: boolean;
  tags: Identifier[];
  gender: string;
  actor_id?: Identifier;
  status: string;
  background: string;
  phone_jsonb: PhoneNumberAndType[];
  nb_tasks?: number;
  company_name?: string;
} & Pick<RaRecord, "id">;

export type Intention = {
  name: string;
  type: string;
  description: string;
  target_type: string;
  target_id: Identifier;
  status: string;
  outcome: string;
  amount: number;
  expected_closing_date: string;
  created_at: string;
  updated_at: string;
  archived_at?: string;
  index: number;
} & Pick<RaRecord, "id">;

export type IntentionContact = {
  id: number;
  intention_id: Identifier;
  contact_id: Identifier;
};

export type Assignment = {
  id: number;
  intention_id: Identifier;
  actor_id: Identifier;
  role: string;
};

export type Note = {
  target_type: string;
  target_id: Identifier;
  text: string;
  actor_id: Identifier;
  status?: string;
  created_at: string;
  attachments?: AttachmentNote[];
} & Pick<RaRecord, "id">;

export type Tag = {
  id: number;
  name: string;
  color: string;
};

export type Task = {
  contact_id: Identifier;
  type: string;
  text: string;
  due_date: string;
  done_date?: string | null;
  actor_id?: Identifier;
} & Pick<RaRecord, "id">;

export type CrmEvent = {
  id: Identifier;
  timestamp: string;
  actor_id?: Identifier;
  actor_type?: string;
  action: string;
  target_type: string;
  target_id: Identifier;
  metadata: Record<string, unknown>;
};

export interface RAFile {
  src: string;
  title: string;
  path?: string;
  rawFile: File;
  type?: string;
}

export type AttachmentNote = RAFile;

export interface LabeledValue {
  value: string;
  label: string;
}

export type IntentionStatus = LabeledValue;

export interface NoteStatus extends LabeledValue {
  color: string;
}

export type Property = {
  id: number;
  contact_id: Identifier;
  key: string;
  value: string;
  type: string;
};

export type Channel = {
  id: number;
  contact_id: Identifier;
  type: string;
  value: string;
  label: string;
};

export type ContactTag = {
  id: number;
  contact_id: Identifier;
  tag_id: Identifier;
};

export type Relationship = {
  contact_a: Identifier;
  contact_b: Identifier;
  type?: string;
  notes?: string;
  created_at: string;
} & Pick<RaRecord, "id">;

export type ExternalId = {
  contact_id: Identifier;
  source: string;
  external_id: string;
} & Pick<RaRecord, "id">;

export type Workflow = {
  name: string;
  trigger?: string;
  steps: Record<string, unknown>[];
  created_at: string;
} & Pick<RaRecord, "id">;

export interface ContactGender {
  value: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}
