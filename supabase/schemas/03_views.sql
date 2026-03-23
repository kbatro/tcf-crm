--
-- Views
-- This file declares all views in the public schema.
--

-- Backward-compatible contacts_summary view
-- Reconstructs the old flat shape from properties/channels/contact_tags
-- Uses group_members instead of company_id
create or replace view public.contacts_summary with (security_invoker = on) as
select
    co.id,
    co.first_name,
    co.last_name,
    co.avatar,
    co.first_seen,
    co.last_seen,
    co.actor_id,
    co.created_at,
    -- company_id from first group membership (backward compat)
    (select gm.group_id from public.group_members gm where gm.contact_id = co.id limit 1) as company_id,
    -- Reconstruct email_jsonb from channels
    coalesce(
        (select jsonb_agg(jsonb_build_object('email', ch.value, 'type', coalesce(ch.label, 'Other')))
         from public.channels ch where ch.contact_id = co.id and ch.type = 'email'),
        '[]'::jsonb
    ) as email_jsonb,
    -- Reconstruct phone_jsonb from channels
    coalesce(
        (select jsonb_agg(jsonb_build_object('number', ch.value, 'type', coalesce(ch.label, 'Other')))
         from public.channels ch where ch.contact_id = co.id and ch.type = 'phone'),
        '[]'::jsonb
    ) as phone_jsonb,
    -- Reconstruct linkedin_url from channels
    (select ch.value from public.channels ch where ch.contact_id = co.id and ch.type = 'linkedin' limit 1) as linkedin_url,
    -- Reconstruct scalar properties
    (select p.value from public.properties p where p.contact_id = co.id and p.key = 'gender' limit 1) as gender,
    (select p.value from public.properties p where p.contact_id = co.id and p.key = 'title' limit 1) as title,
    (select p.value from public.properties p where p.contact_id = co.id and p.key = 'background' limit 1) as background,
    (select p.value from public.properties p where p.contact_id = co.id and p.key = 'status' limit 1) as status,
    coalesce((select p.value from public.properties p where p.contact_id = co.id and p.key = 'has_newsletter' limit 1), 'false')::boolean as has_newsletter,
    -- Reconstruct tags array from contact_tags
    coalesce(
        (select array_agg(ct.tag_id) from public.contact_tags ct where ct.contact_id = co.id),
        array[]::bigint[]
    ) as tags,
    -- Full-text search columns
    coalesce(
        (select string_agg(ch.value, ', ') from public.channels ch where ch.contact_id = co.id and ch.type = 'email'),
        ''
    ) as email_fts,
    coalesce(
        (select string_agg(ch.value, ', ') from public.channels ch where ch.contact_id = co.id and ch.type = 'phone'),
        ''
    ) as phone_fts,
    (select g.name from public.groups g
     inner join public.group_members gm on gm.group_id = g.id
     where gm.contact_id = co.id limit 1) as company_name,
    count(distinct t.id) filter (where t.done_date is null) as nb_tasks
from public.contacts co
    left join public.tasks t on co.id = t.contact_id
group by co.id;

-- Backward-compatible companies_summary view
-- Reads from groups + group_properties to maintain the old company shape
create or replace view public.companies_summary with (security_invoker = on) as
select
    g.id,
    g.created_at,
    g.name,
    (select gp.value from public.group_properties gp where gp.group_id = g.id and gp.key = 'sector' limit 1) as sector,
    (select gp.value::smallint from public.group_properties gp where gp.group_id = g.id and gp.key = 'size' limit 1) as size,
    (select gp.value from public.group_properties gp where gp.group_id = g.id and gp.key = 'linkedin_url' limit 1) as linkedin_url,
    (select gp.value from public.group_properties gp where gp.group_id = g.id and gp.key = 'website' limit 1) as website,
    (select gp.value from public.group_properties gp where gp.group_id = g.id and gp.key = 'phone_number' limit 1) as phone_number,
    (select gp.value from public.group_properties gp where gp.group_id = g.id and gp.key = 'address' limit 1) as address,
    (select gp.value from public.group_properties gp where gp.group_id = g.id and gp.key = 'zipcode' limit 1) as zipcode,
    (select gp.value from public.group_properties gp where gp.group_id = g.id and gp.key = 'city' limit 1) as city,
    (select gp.value from public.group_properties gp where gp.group_id = g.id and gp.key = 'state_abbr' limit 1) as state_abbr,
    g.actor_id,
    (select gp.value from public.group_properties gp where gp.group_id = g.id and gp.key = 'context_links' limit 1) as context_links,
    (select gp.value from public.group_properties gp where gp.group_id = g.id and gp.key = 'country' limit 1) as country,
    (select gp.value from public.group_properties gp where gp.group_id = g.id and gp.key = 'description' limit 1) as description,
    (select gp.value from public.group_properties gp where gp.group_id = g.id and gp.key = 'revenue' limit 1) as revenue,
    (select gp.value from public.group_properties gp where gp.group_id = g.id and gp.key = 'tax_identifier' limit 1) as tax_identifier,
    g.avatar as logo,
    g.group_type_id,
    count(distinct i.id) as nb_intentions,
    count(distinct gm.contact_id) as nb_contacts
from public.groups g
    left join public.intentions i on g.id = i.target_id and i.target_type = 'group'
    left join public.group_members gm on g.id = gm.group_id
group by g.id;

create or replace view public.init_state with (security_invoker = off) as
select count(sub.id) as is_initialized
from (
    select actors.id from public.actors limit 1
) sub;
