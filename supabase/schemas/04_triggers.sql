--
-- Triggers
-- This file declares all triggers.
--

-- Auto-populate actor_id from current auth user on insert
create or replace trigger set_group_actor_id_trigger
    before insert on public.groups
    for each row execute function public.set_actor_id_default();

create or replace trigger set_contact_actor_id_trigger
    before insert on public.contacts
    for each row execute function public.set_actor_id_default();

create or replace trigger set_notes_actor_id_trigger
    before insert on public.notes
    for each row execute function public.set_actor_id_default();

create or replace trigger set_task_actor_id_trigger
    before insert on public.tasks
    for each row execute function public.set_actor_id_default();

-- Auto-fetch group avatar from website property favicon on save
create or replace trigger group_saved
    before insert or update on public.groups
    for each row execute function public.handle_group_saved();

-- Auto-fetch contact avatar from email on save
create or replace trigger contact_saved
    before insert or update on public.contacts
    for each row execute function public.handle_contact_saved();

-- Update contact.last_seen when a note targeting a contact is created
create or replace trigger on_public_notes_created_or_updated
    after insert on public.notes
    for each row execute function public.handle_note_created_or_updated();

-- Cleanup storage attachments when notes are updated or deleted
create or replace trigger on_notes_attachments_updated_delete_note_attachments
    after update on public.notes
    for each row
    when (old.attachments is distinct from new.attachments)
    execute function public.cleanup_note_attachments();

create or replace trigger on_notes_deleted_delete_note_attachments
    after delete on public.notes
    for each row execute function public.cleanup_note_attachments();

-- Event triggers: append to events table on data changes

create or replace trigger event_on_contact_created
    after insert on public.contacts
    for each row execute function public.handle_event_contact_created();

create or replace trigger event_on_group_created
    after insert on public.groups
    for each row execute function public.handle_event_group_created();

create or replace trigger event_on_intention_created
    after insert on public.intentions
    for each row execute function public.handle_event_intention_created();

create or replace trigger event_on_note_created
    after insert on public.notes
    for each row execute function public.handle_event_note_created();

create or replace trigger event_on_intention_status_changed
    after update on public.intentions
    for each row execute function public.handle_event_intention_status_changed();

create or replace trigger event_on_group_member_joined
    after insert on public.group_members
    for each row execute function public.handle_event_group_member_joined();

-- Auth triggers: sync auth.users to public.actors
create or replace trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

create or replace trigger on_auth_user_updated
    after update on auth.users
    for each row execute function public.handle_update_user();
