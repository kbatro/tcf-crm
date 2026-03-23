import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import type { Attachment } from "./extractAndUploadAttachments.ts";
import { MAIL_PROVIDERS } from "./mailProvider.const.ts";

export const getOrCreateGroupFromDomain = async (
  domain: string,
  actorId: number,
) => {
  // Check if the group already exists (by name)
  const { data: existingGroup, error: fetchGroupError } = await supabaseAdmin
    .from("groups")
    .select("*")
    .eq("name", domain)
    .maybeSingle();
  if (fetchGroupError) {
    throw new Error(
      `Could not fetch groups from database, name: ${domain}, error: ${fetchGroupError.message}`,
    );
  }

  if (existingGroup) {
    return existingGroup;
  }

  if (MAIL_PROVIDERS.includes(domain)) {
    // We don't want to create groups for generic mail providers, as they are not really companies and it would pollute the database with useless entries.
    return null;
  }

  // Look up the "company" group_type
  const { data: companyType, error: typeError } = await supabaseAdmin
    .from("group_types")
    .select("id")
    .eq("name", "company")
    .maybeSingle();
  if (typeError) {
    throw new Error(
      `Could not fetch group_types from database, error: ${typeError.message}`,
    );
  }

  const { data: newGroups, error: createGroupError } = await supabaseAdmin
    .from("groups")
    .insert({
      name: domain,
      actor_id: actorId,
      group_type_id: companyType?.id ?? null,
    })
    .select();
  if (createGroupError) {
    throw new Error(
      `Could not create group in database, name: ${domain}, error: ${createGroupError.message}`,
    );
  }
  return newGroups[0];
};

export const getOrCreateContactFromEmailInfo = async ({
  email,
  firstName,
  lastName,
  actorId,
  domain,
}: {
  email: string;
  firstName: string;
  lastName: string;
  actorId: number;
  domain: string;
}) => {
  // Check if the contact already exists by looking up the email in channels
  const { data: existingChannel, error: fetchChannelError } =
    await supabaseAdmin
      .from("channels")
      .select("contact_id, contacts(*)")
      .eq("type", "email")
      .eq("value", email)
      .maybeSingle();
  if (fetchChannelError) {
    throw new Error(
      `Could not fetch contact from database, email: ${email}, error: ${fetchChannelError.message}`,
    );
  }

  if (existingChannel?.contacts) {
    return existingChannel.contacts;
  }

  const group = await getOrCreateGroupFromDomain(domain, actorId);

  // Create the contact (no company_id - use group_members instead)
  const { data: newContacts, error: createContactError } = await supabaseAdmin
    .from("contacts")
    .insert({
      first_name: firstName,
      last_name: lastName,
      actor_id: actorId,
      first_seen: new Date(),
      last_seen: new Date(),
    })
    .select();
  if (createContactError || !newContacts[0]) {
    throw new Error(
      `Could not create contact in database, email: ${email}, error: ${createContactError?.message}`,
    );
  }

  // Create the email channel for the new contact
  const { error: createChannelError } = await supabaseAdmin
    .from("channels")
    .insert({
      contact_id: newContacts[0].id,
      type: "email",
      value: email,
      label: "Work",
    });
  if (createChannelError) {
    throw new Error(
      `Could not create channel for contact, email: ${email}, error: ${createChannelError.message}`,
    );
  }

  // If we have a group, create a group_members entry
  if (group) {
    const { error: memberError } = await supabaseAdmin
      .from("group_members")
      .insert({
        group_id: group.id,
        contact_id: newContacts[0].id,
      });
    if (memberError) {
      throw new Error(
        `Could not create group membership for contact, email: ${email}, error: ${memberError.message}`,
      );
    }
  }

  return newContacts[0];
};

export const addNoteToContact = async ({
  actorEmail,
  email,
  domain,
  firstName,
  lastName,
  noteContent,
  attachments,
}: {
  actorEmail: string;
  email: string;
  domain: string;
  firstName: string;
  lastName: string;
  noteContent: string;
  attachments: Attachment[];
}) => {
  const { data: actor, error: fetchActorError } = await supabaseAdmin
    .from("actors")
    .select("*")
    .eq("email", actorEmail)
    .neq("disabled", true)
    .maybeSingle();

  if (fetchActorError) {
    return new Response(
      `Could not fetch actor from database, email: ${actorEmail}`,
      { status: 500 },
    );
  }
  if (!actor) {
    // Return a 403 to let Postmark know that it's no use to retry this request
    // https://postmarkapp.com/developer/webhooks/inbound-webhook#errors-and-retries
    return new Response(
      `Unable to find (active) actor in database, email: ${actorEmail}`,
      { status: 403 },
    );
  }

  const { contact, error } = await getOrCreateContactFromEmailInfo({
    email,
    firstName,
    lastName,
    actorId: actor.id,
    domain,
  })
    .then((contact) => ({
      contact,
    }))
    .catch((error) => {
      return {
        error,
      };
    });

  if (error) {
    console.error(
      "Error in getOrCreateContactFromEmailInfo for email:",
      email,
      "actor:",
      actorEmail,
      "error:",
      error,
    );
    return new Response(
      `Could not get or create contact from database, email: ${email}, actor: ${actorEmail}`,
      { status: 500 },
    );
  }

  // Add note to contact
  const { error: createNoteError } = await supabaseAdmin
    .from("notes")
    .insert({
      target_type: "contact",
      target_id: contact.id,
      text: noteContent,
      actor_id: actor.id,
      attachments,
    });
  if (createNoteError) {
    return new Response(
      `Could not add note to contact ${email}, actor ${actorEmail}`,
      { status: 500 },
    );
  }

  await supabaseAdmin
    .from("contacts")
    .update({ last_seen: new Date() })
    .eq("id", contact.id);
};
