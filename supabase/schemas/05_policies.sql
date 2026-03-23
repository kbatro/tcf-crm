--
-- Row Level Security
-- This file declares RLS policies for all tables.
--

-- Enable RLS on all tables
alter table public.actors enable row level security;
alter table public.group_types enable row level security;
alter table public.groups enable row level security;
alter table public.group_properties enable row level security;
alter table public.group_members enable row level security;
alter table public.contacts enable row level security;
alter table public.properties enable row level security;
alter table public.channels enable row level security;
alter table public.contact_tags enable row level security;
alter table public.intentions enable row level security;
alter table public.intention_contacts enable row level security;
alter table public.assignments enable row level security;
alter table public.notes enable row level security;
alter table public.tags enable row level security;
alter table public.tasks enable row level security;
alter table public.configuration enable row level security;
alter table public.events enable row level security;
alter table public.favicons_excluded_domains enable row level security;

-- Actors
create policy "Enable read access for authenticated users" on public.actors for select to authenticated using (true);

-- Group Types (admin-only writes)
create policy "Enable read access for authenticated users" on public.group_types for select to authenticated using (true);
create policy "Enable insert for admins" on public.group_types for insert to authenticated with check (public.is_admin());
create policy "Enable update for admins" on public.group_types for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Enable delete for admins" on public.group_types for delete to authenticated using (public.is_admin());

-- Groups
create policy "Enable read access for authenticated users" on public.groups for select to authenticated using (true);
create policy "Enable insert for authenticated users only" on public.groups for insert to authenticated with check (true);
create policy "Enable update for authenticated users only" on public.groups for update to authenticated using (true) with check (true);
create policy "Group Delete Policy" on public.groups for delete to authenticated using (true);

-- Group Properties
create policy "Enable read access for authenticated users" on public.group_properties for select to authenticated using (true);
create policy "Enable insert for authenticated users only" on public.group_properties for insert to authenticated with check (true);
create policy "Enable update for authenticated users only" on public.group_properties for update to authenticated using (true) with check (true);
create policy "Group Properties Delete Policy" on public.group_properties for delete to authenticated using (true);

-- Group Members
create policy "Enable read access for authenticated users" on public.group_members for select to authenticated using (true);
create policy "Enable insert for authenticated users only" on public.group_members for insert to authenticated with check (true);
create policy "Enable update for authenticated users only" on public.group_members for update to authenticated using (true) with check (true);
create policy "Group Members Delete Policy" on public.group_members for delete to authenticated using (true);

-- Contacts
create policy "Enable read access for authenticated users" on public.contacts for select to authenticated using (true);
create policy "Enable insert for authenticated users only" on public.contacts for insert to authenticated with check (true);
create policy "Enable update for authenticated users only" on public.contacts for update to authenticated using (true) with check (true);
create policy "Contact Delete Policy" on public.contacts for delete to authenticated using (true);

-- Properties
create policy "Enable read access for authenticated users" on public.properties for select to authenticated using (true);
create policy "Enable insert for authenticated users only" on public.properties for insert to authenticated with check (true);
create policy "Enable update for authenticated users only" on public.properties for update to authenticated using (true) with check (true);
create policy "Properties Delete Policy" on public.properties for delete to authenticated using (true);

-- Channels
create policy "Enable read access for authenticated users" on public.channels for select to authenticated using (true);
create policy "Enable insert for authenticated users only" on public.channels for insert to authenticated with check (true);
create policy "Enable update for authenticated users only" on public.channels for update to authenticated using (true) with check (true);
create policy "Channels Delete Policy" on public.channels for delete to authenticated using (true);

-- Contact Tags
create policy "Enable read access for authenticated users" on public.contact_tags for select to authenticated using (true);
create policy "Enable insert for authenticated users only" on public.contact_tags for insert to authenticated with check (true);
create policy "Enable update for authenticated users only" on public.contact_tags for update to authenticated using (true) with check (true);
create policy "Contact Tags Delete Policy" on public.contact_tags for delete to authenticated using (true);

-- Intentions
create policy "Enable read access for authenticated users" on public.intentions for select to authenticated using (true);
create policy "Enable insert for authenticated users only" on public.intentions for insert to authenticated with check (true);
create policy "Enable update for authenticated users only" on public.intentions for update to authenticated using (true) with check (true);
create policy "Intentions Delete Policy" on public.intentions for delete to authenticated using (true);

-- Intention Contacts
create policy "Enable read access for authenticated users" on public.intention_contacts for select to authenticated using (true);
create policy "Enable insert for authenticated users only" on public.intention_contacts for insert to authenticated with check (true);
create policy "Enable update for authenticated users only" on public.intention_contacts for update to authenticated using (true) with check (true);
create policy "Intention Contacts Delete Policy" on public.intention_contacts for delete to authenticated using (true);

-- Assignments
create policy "Enable read access for authenticated users" on public.assignments for select to authenticated using (true);
create policy "Enable insert for authenticated users only" on public.assignments for insert to authenticated with check (true);
create policy "Enable update for authenticated users only" on public.assignments for update to authenticated using (true) with check (true);
create policy "Assignments Delete Policy" on public.assignments for delete to authenticated using (true);

-- Notes
create policy "Enable read access for authenticated users" on public.notes for select to authenticated using (true);
create policy "Enable insert for authenticated users only" on public.notes for insert to authenticated with check (true);
create policy "Notes Update Policy" on public.notes for update to authenticated using (true);
create policy "Notes Delete Policy" on public.notes for delete to authenticated using (true);

-- Tags
create policy "Enable read access for authenticated users" on public.tags for select to authenticated using (true);
create policy "Enable insert for authenticated users only" on public.tags for insert to authenticated with check (true);
create policy "Enable update for authenticated users only" on public.tags for update to authenticated using (true);
create policy "Enable delete for authenticated users only" on public.tags for delete to authenticated using (true);

-- Tasks
create policy "Enable read access for authenticated users" on public.tasks for select to authenticated using (true);
create policy "Enable insert for authenticated users only" on public.tasks for insert to authenticated with check (true);
create policy "Task Update Policy" on public.tasks for update to authenticated using (true);
create policy "Task Delete Policy" on public.tasks for delete to authenticated using (true);

-- Configuration (admin-only for writes)
create policy "Enable read for authenticated" on public.configuration for select to authenticated using (true);
create policy "Enable insert for admins" on public.configuration for insert to authenticated with check (public.is_admin());
create policy "Enable update for admins" on public.configuration for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Events
create policy "Enable read access for authenticated users" on public.events for select to authenticated using (true);

-- Favicons excluded domains
create policy "Enable access for authenticated users only" on public.favicons_excluded_domains to authenticated using (true) with check (true);

-- Relationships
alter table public.relationships enable row level security;
create policy "Enable read access for authenticated users" on public.relationships for select to authenticated using (true);
create policy "Enable insert for authenticated users only" on public.relationships for insert to authenticated with check (true);
create policy "Enable update for authenticated users only" on public.relationships for update to authenticated using (true) with check (true);
create policy "Relationships Delete Policy" on public.relationships for delete to authenticated using (true);

-- External IDs
alter table public.external_ids enable row level security;
create policy "Enable read access for authenticated users" on public.external_ids for select to authenticated using (true);
create policy "Enable insert for authenticated users only" on public.external_ids for insert to authenticated with check (true);
create policy "Enable update for authenticated users only" on public.external_ids for update to authenticated using (true) with check (true);
create policy "External IDs Delete Policy" on public.external_ids for delete to authenticated using (true);

-- Workflows
alter table public.workflows enable row level security;
create policy "Enable read access for authenticated users" on public.workflows for select to authenticated using (true);
create policy "Enable insert for authenticated users only" on public.workflows for insert to authenticated with check (true);
create policy "Enable update for authenticated users only" on public.workflows for update to authenticated using (true) with check (true);
create policy "Workflows Delete Policy" on public.workflows for delete to authenticated using (true);
