--
-- Grants
-- This file declares all grants and default privileges for the public schema.
--

-- Schema usage
grant usage on schema public to postgres;
grant usage on schema public to anon;
grant usage on schema public to authenticated;
grant usage on schema public to service_role;

-- Function grants
grant all on function public.cleanup_note_attachments() to anon;
grant all on function public.cleanup_note_attachments() to authenticated;
grant all on function public.cleanup_note_attachments() to service_role;

grant all on function public.get_avatar_for_email(text) to anon;
grant all on function public.get_avatar_for_email(text) to authenticated;
grant all on function public.get_avatar_for_email(text) to service_role;

grant all on function public.get_domain_favicon(text) to anon;
grant all on function public.get_domain_favicon(text) to authenticated;
grant all on function public.get_domain_favicon(text) to service_role;

grant all on function public.get_note_attachments_function_url() to anon;
grant all on function public.get_note_attachments_function_url() to authenticated;
grant all on function public.get_note_attachments_function_url() to service_role;

revoke all on function public.get_user_id_by_email(text) from public;
grant all on function public.get_user_id_by_email(text) to service_role;

grant all on function public.handle_group_saved() to anon;
grant all on function public.handle_group_saved() to authenticated;
grant all on function public.handle_group_saved() to service_role;

grant all on function public.handle_note_created_or_updated() to anon;
grant all on function public.handle_note_created_or_updated() to authenticated;
grant all on function public.handle_note_created_or_updated() to service_role;

grant all on function public.handle_contact_saved() to anon;
grant all on function public.handle_contact_saved() to authenticated;
grant all on function public.handle_contact_saved() to service_role;

grant all on function public.handle_new_user() to anon;
grant all on function public.handle_new_user() to authenticated;
grant all on function public.handle_new_user() to service_role;

grant all on function public.handle_update_user() to anon;
grant all on function public.handle_update_user() to authenticated;
grant all on function public.handle_update_user() to service_role;

grant all on function public.is_admin() to anon;
grant all on function public.is_admin() to authenticated;
grant all on function public.is_admin() to service_role;

grant all on function public.merge_contacts(bigint, bigint) to anon;
grant all on function public.merge_contacts(bigint, bigint) to authenticated;
grant all on function public.merge_contacts(bigint, bigint) to service_role;

grant all on function public.set_actor_id_default() to anon;
grant all on function public.set_actor_id_default() to authenticated;
grant all on function public.set_actor_id_default() to service_role;

-- Table grants
grant all on table public.actors to anon;
grant all on table public.actors to authenticated;
grant all on table public.actors to service_role;

grant all on table public.group_types to anon;
grant all on table public.group_types to authenticated;
grant all on table public.group_types to service_role;

grant all on table public.groups to anon;
grant all on table public.groups to authenticated;
grant all on table public.groups to service_role;

grant all on table public.group_properties to anon;
grant all on table public.group_properties to authenticated;
grant all on table public.group_properties to service_role;

grant all on table public.group_members to anon;
grant all on table public.group_members to authenticated;
grant all on table public.group_members to service_role;

grant all on table public.contacts to anon;
grant all on table public.contacts to authenticated;
grant all on table public.contacts to service_role;

grant all on table public.properties to anon;
grant all on table public.properties to authenticated;
grant all on table public.properties to service_role;

grant all on table public.channels to anon;
grant all on table public.channels to authenticated;
grant all on table public.channels to service_role;

grant all on table public.contact_tags to anon;
grant all on table public.contact_tags to authenticated;
grant all on table public.contact_tags to service_role;

grant all on table public.intentions to anon;
grant all on table public.intentions to authenticated;
grant all on table public.intentions to service_role;

grant all on table public.intention_contacts to anon;
grant all on table public.intention_contacts to authenticated;
grant all on table public.intention_contacts to service_role;

grant all on table public.assignments to anon;
grant all on table public.assignments to authenticated;
grant all on table public.assignments to service_role;

grant all on table public.notes to anon;
grant all on table public.notes to authenticated;
grant all on table public.notes to service_role;

grant all on table public.tags to anon;
grant all on table public.tags to authenticated;
grant all on table public.tags to service_role;

grant all on table public.tasks to anon;
grant all on table public.tasks to authenticated;
grant all on table public.tasks to service_role;

grant all on table public.configuration to anon;
grant all on table public.configuration to authenticated;
grant all on table public.configuration to service_role;

grant all on table public.favicons_excluded_domains to anon;
grant all on table public.favicons_excluded_domains to authenticated;
grant all on table public.favicons_excluded_domains to service_role;

grant all on table public.relationships to anon;
grant all on table public.relationships to authenticated;
grant all on table public.relationships to service_role;

grant all on table public.external_ids to anon;
grant all on table public.external_ids to authenticated;
grant all on table public.external_ids to service_role;

grant all on table public.workflows to anon;
grant all on table public.workflows to authenticated;
grant all on table public.workflows to service_role;

-- Events table grants
grant all on table public.events to anon;
grant all on table public.events to authenticated;
grant all on table public.events to service_role;

-- Event function grants
grant all on function public.handle_event_contact_created() to anon;
grant all on function public.handle_event_contact_created() to authenticated;
grant all on function public.handle_event_contact_created() to service_role;

grant all on function public.handle_event_group_created() to anon;
grant all on function public.handle_event_group_created() to authenticated;
grant all on function public.handle_event_group_created() to service_role;

grant all on function public.handle_event_intention_created() to anon;
grant all on function public.handle_event_intention_created() to authenticated;
grant all on function public.handle_event_intention_created() to service_role;

grant all on function public.handle_event_note_created() to anon;
grant all on function public.handle_event_note_created() to authenticated;
grant all on function public.handle_event_note_created() to service_role;

grant all on function public.handle_event_intention_status_changed() to anon;
grant all on function public.handle_event_intention_status_changed() to authenticated;
grant all on function public.handle_event_intention_status_changed() to service_role;

grant all on function public.handle_event_group_member_joined() to anon;
grant all on function public.handle_event_group_member_joined() to authenticated;
grant all on function public.handle_event_group_member_joined() to service_role;

-- View grants
grant all on table public.companies_summary to anon;
grant all on table public.companies_summary to authenticated;
grant all on table public.companies_summary to service_role;

grant all on table public.contacts_summary to anon;
grant all on table public.contacts_summary to authenticated;
grant all on table public.contacts_summary to service_role;

grant all on table public.init_state to anon;
grant all on table public.init_state to authenticated;
grant all on table public.init_state to service_role;

-- Sequence grants
grant all on sequence public.actors_id_seq to anon;
grant all on sequence public.actors_id_seq to authenticated;
grant all on sequence public.actors_id_seq to service_role;

grant all on sequence public.group_types_id_seq to anon;
grant all on sequence public.group_types_id_seq to authenticated;
grant all on sequence public.group_types_id_seq to service_role;

grant all on sequence public.groups_id_seq to anon;
grant all on sequence public.groups_id_seq to authenticated;
grant all on sequence public.groups_id_seq to service_role;

grant all on sequence public.group_properties_id_seq to anon;
grant all on sequence public.group_properties_id_seq to authenticated;
grant all on sequence public.group_properties_id_seq to service_role;

grant all on sequence public.group_members_id_seq to anon;
grant all on sequence public.group_members_id_seq to authenticated;
grant all on sequence public.group_members_id_seq to service_role;

grant all on sequence public.contacts_id_seq to anon;
grant all on sequence public.contacts_id_seq to authenticated;
grant all on sequence public.contacts_id_seq to service_role;

grant all on sequence public.properties_id_seq to anon;
grant all on sequence public.properties_id_seq to authenticated;
grant all on sequence public.properties_id_seq to service_role;

grant all on sequence public.channels_id_seq to anon;
grant all on sequence public.channels_id_seq to authenticated;
grant all on sequence public.channels_id_seq to service_role;

grant all on sequence public.contact_tags_id_seq to anon;
grant all on sequence public.contact_tags_id_seq to authenticated;
grant all on sequence public.contact_tags_id_seq to service_role;

grant all on sequence public.intentions_id_seq to anon;
grant all on sequence public.intentions_id_seq to authenticated;
grant all on sequence public.intentions_id_seq to service_role;

grant all on sequence public.intention_contacts_id_seq to anon;
grant all on sequence public.intention_contacts_id_seq to authenticated;
grant all on sequence public.intention_contacts_id_seq to service_role;

grant all on sequence public.assignments_id_seq to anon;
grant all on sequence public.assignments_id_seq to authenticated;
grant all on sequence public.assignments_id_seq to service_role;

grant all on sequence public.notes_id_seq to anon;
grant all on sequence public.notes_id_seq to authenticated;
grant all on sequence public.notes_id_seq to service_role;

grant all on sequence public.favicons_excluded_domains_id_seq to anon;
grant all on sequence public.favicons_excluded_domains_id_seq to authenticated;
grant all on sequence public.favicons_excluded_domains_id_seq to service_role;

grant all on sequence public.tags_id_seq to anon;
grant all on sequence public.tags_id_seq to authenticated;
grant all on sequence public.tags_id_seq to service_role;

grant all on sequence public.tasks_id_seq to anon;
grant all on sequence public.tasks_id_seq to authenticated;
grant all on sequence public.tasks_id_seq to service_role;

grant all on sequence public.relationships_id_seq to anon;
grant all on sequence public.relationships_id_seq to authenticated;
grant all on sequence public.relationships_id_seq to service_role;

grant all on sequence public.external_ids_id_seq to anon;
grant all on sequence public.external_ids_id_seq to authenticated;
grant all on sequence public.external_ids_id_seq to service_role;

grant all on sequence public.workflows_id_seq to anon;
grant all on sequence public.workflows_id_seq to authenticated;
grant all on sequence public.workflows_id_seq to service_role;

grant all on sequence public.events_id_seq to anon;
grant all on sequence public.events_id_seq to authenticated;
grant all on sequence public.events_id_seq to service_role;

-- Default privileges
alter default privileges for role postgres in schema public grant all on sequences to postgres;
alter default privileges for role postgres in schema public grant all on sequences to anon;
alter default privileges for role postgres in schema public grant all on sequences to authenticated;
alter default privileges for role postgres in schema public grant all on sequences to service_role;

alter default privileges for role postgres in schema public grant all on functions to postgres;
alter default privileges for role postgres in schema public grant all on functions to anon;
alter default privileges for role postgres in schema public grant all on functions to authenticated;
alter default privileges for role postgres in schema public grant all on functions to service_role;

alter default privileges for role postgres in schema public grant all on tables to postgres;
alter default privileges for role postgres in schema public grant all on tables to anon;
alter default privileges for role postgres in schema public grant all on tables to authenticated;
alter default privileges for role postgres in schema public grant all on tables to service_role;
