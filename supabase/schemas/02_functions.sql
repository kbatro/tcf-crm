--
-- Functions
-- This file declares all PL/pgSQL functions in the public schema.
--

CREATE OR REPLACE FUNCTION "public"."cleanup_note_attachments"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
    DECLARE
      payload jsonb;
      request_headers jsonb;
      auth_header text;
    BEGIN
      request_headers := coalesce(
        nullif(current_setting('request.headers', true), '')::jsonb,
        '{}'::jsonb
      );
      auth_header := request_headers ->> 'authorization';

      IF auth_header IS NULL OR auth_header = '' THEN
        IF TG_OP = 'DELETE' THEN
          RETURN OLD;
        END IF;

        RETURN NEW;
      END IF;

      payload := jsonb_build_object(
        'old_record', OLD,
        'record', NEW,
        'type', TG_OP
      );

      PERFORM net.http_post(
        url := public.get_note_attachments_function_url(),
        body := payload,
        params := '{}'::jsonb,
        headers := jsonb_build_object(
          'Content-Type',
          'application/json',
          'Authorization',
          auth_header
        ),
        timeout_milliseconds := 10000
      );

      IF TG_OP = 'DELETE' THEN
        RETURN OLD;
      END IF;

      RETURN NEW;
    END;
    $$;

CREATE OR REPLACE FUNCTION "public"."get_avatar_for_email"("email" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare email_hash text;
declare gravatar_url text;
declare gravatar_status int8;
declare email_domain text;
declare favicon_url text;
declare domain_status int8;

begin
    -- Try to fetch a gravatar image
    email_hash = encode(extensions.digest(email, 'sha256'), 'hex');
    gravatar_url = concat('https://www.gravatar.com/avatar/', email_hash, '?d=404');

    select status from extensions.http_get(gravatar_url) into gravatar_status;

    if gravatar_status = 200 then
        return gravatar_url;
    end if;

    -- Fallback to email's domain favicon if not excluded
    email_domain = split_part(email, '@', 2);
    return get_domain_favicon(email_domain);
exception
    when others then
        return 'ERROR';
end;
$$;

CREATE OR REPLACE FUNCTION "public"."get_domain_favicon"("domain_name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare domain_status int8;

begin
    if exists (select from favicons_excluded_domains as fav where fav.domain = domain_name) then
        return null;
    end if;

    return concat(
        'https://favicon.show/',
        (regexp_matches(domain_name, '^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)', 'i'))[1]
    );
end;
$$;

CREATE OR REPLACE FUNCTION "public"."get_note_attachments_function_url"() RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
    DECLARE
      issuer text;
      function_url text;
    BEGIN
      issuer := coalesce(
        nullif(current_setting('request.jwt.claim.iss', true), ''),
        (
          coalesce(
            nullif(current_setting('request.jwt.claims', true), ''),
            '{}'
          )::jsonb ->> 'iss'
        )
      );
      issuer := nullif(issuer, '');
      IF issuer IS NOT NULL THEN
        issuer := rtrim(issuer, '/');
        IF right(issuer, 8) = '/auth/v1' THEN
          function_url :=
            left(issuer, length(issuer) - 8) || '/functions/v1/delete_note_attachments';

          IF function_url LIKE 'http://127.0.0.1:%' THEN
            RETURN replace(
              function_url,
              'http://127.0.0.1:',
              'http://host.docker.internal:'
            );
          END IF;

          IF function_url LIKE 'http://localhost:%' THEN
            RETURN replace(
              function_url,
              'http://localhost:',
              'http://host.docker.internal:'
            );
          END IF;

          RETURN function_url;
        END IF;
      END IF;

      RETURN 'http://host.docker.internal:54321/functions/v1/delete_note_attachments';
    END;
    $$;

CREATE OR REPLACE FUNCTION "public"."get_user_id_by_email"("email" "text") RETURNS TABLE("id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
BEGIN
  RETURN QUERY SELECT au.id FROM auth.users au WHERE au.email = $1;
END;
$_$;

CREATE OR REPLACE FUNCTION "public"."handle_group_saved"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare group_avatar text;
declare website_value text;

begin
    if new.avatar is not null then
        return new;
    end if;

    -- Look up the website property for this group
    select gp.value into website_value
    from group_properties gp
    where gp.group_id = new.id and gp.key = 'website'
    limit 1;

    if website_value is null then
        return new;
    end if;

    group_avatar = get_domain_favicon(website_value);
    if group_avatar is null then
        return new;
    end if;

    new.avatar = concat('{"src":"', group_avatar, '","title":"Group favicon"}');
    return new;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."handle_note_created_or_updated"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if new.target_type = 'contact' then
    update public.contacts set last_seen = new.created_at where contacts.id = new.target_id and contacts.last_seen < new.created_at;
  end if;
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."handle_contact_saved"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$declare contact_avatar text;
declare channel_email text;

begin
    if new.avatar is not null then
        return new;
    end if;

    -- Look up the first email channel for this contact
    select ch.value into channel_email
    from channels ch
    where ch.contact_id = new.id and ch.type = 'email'
    limit 1;

    if channel_email is null then
        return new;
    end if;

    select public.get_avatar_for_email(channel_email) into contact_avatar;

    if contact_avatar is null then
        return new;
    end if;

    new.avatar = concat('{"src":"', contact_avatar, '"}');
    return new;
end;$$;

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  actor_count int;
begin
  select count(id) into actor_count
  from public.actors;

  insert into public.actors (first_name, last_name, email, user_id, administrator)
  values (
    coalesce(new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data -> 'custom_claims' ->> 'first_name', 'Pending'),
    coalesce(new.raw_user_meta_data ->> 'last_name', new.raw_user_meta_data -> 'custom_claims' ->> 'last_name', 'Pending'),
    new.email,
    new.id,
    case when actor_count > 0 then FALSE else TRUE end
  );
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."handle_update_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  update public.actors
  set
    first_name = coalesce(new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data -> 'custom_claims' ->> 'first_name', 'Pending'),
    last_name = coalesce(new.raw_user_meta_data ->> 'last_name', new.raw_user_meta_data -> 'custom_claims' ->> 'last_name', 'Pending'),
    email = new.email
  where user_id = new.id;

  return new;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  return exists (
    select 1 from public.actors where user_id = auth.uid() and administrator = true
  );
end;
$$;

CREATE OR REPLACE FUNCTION "public"."merge_contacts"("loser_id" bigint, "winner_id" bigint) RETURNS bigint
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  winner_contact contacts%ROWTYPE;
  loser_contact contacts%ROWTYPE;
BEGIN
  -- Fetch both contacts
  SELECT * INTO winner_contact FROM contacts WHERE id = winner_id;
  SELECT * INTO loser_contact FROM contacts WHERE id = loser_id;

  IF winner_contact IS NULL OR loser_contact IS NULL THEN
    RAISE EXCEPTION 'Contact not found';
  END IF;

  -- 1. Reassign tasks from loser to winner
  UPDATE tasks SET contact_id = winner_id WHERE contact_id = loser_id;

  -- 2. Reassign notes (target_type='contact') from loser to winner
  UPDATE notes SET target_id = winner_id WHERE target_type = 'contact' AND target_id = loser_id;

  -- 3. Update intention_contacts - replace loser with winner, skip duplicates
  INSERT INTO intention_contacts (intention_id, contact_id)
  SELECT li.intention_id, winner_id
  FROM intention_contacts li
  WHERE li.contact_id = loser_id
    AND NOT EXISTS (
      SELECT 1 FROM intention_contacts wi
      WHERE wi.contact_id = winner_id
        AND wi.intention_id = li.intention_id
    );
  DELETE FROM intention_contacts WHERE contact_id = loser_id;

  -- 4. Merge channels: move loser channels to winner, skip duplicates
  INSERT INTO channels (contact_id, type, value, label)
  SELECT winner_id, lc.type, lc.value, lc.label
  FROM channels lc
  WHERE lc.contact_id = loser_id
    AND NOT EXISTS (
      SELECT 1 FROM channels wc
      WHERE wc.contact_id = winner_id
        AND wc.type = lc.type
        AND wc.value = lc.value
    );

  -- 5. Merge properties: move loser properties to winner, skip duplicates
  INSERT INTO properties (contact_id, key, value, type)
  SELECT winner_id, lp.key, lp.value, lp.type
  FROM properties lp
  WHERE lp.contact_id = loser_id
    AND NOT EXISTS (
      SELECT 1 FROM properties wp
      WHERE wp.contact_id = winner_id
        AND wp.key = lp.key
    );

  -- 6. Merge contact_tags: move loser tags to winner, skip duplicates
  INSERT INTO contact_tags (contact_id, tag_id)
  SELECT winner_id, lt.tag_id
  FROM contact_tags lt
  WHERE lt.contact_id = loser_id
    AND NOT EXISTS (
      SELECT 1 FROM contact_tags wt
      WHERE wt.contact_id = winner_id
        AND wt.tag_id = lt.tag_id
    );

  -- 7. Merge group_members: move loser memberships to winner, skip duplicates
  INSERT INTO group_members (group_id, contact_id, role, joined_at, left_at)
  SELECT lm.group_id, winner_id, lm.role, lm.joined_at, lm.left_at
  FROM group_members lm
  WHERE lm.contact_id = loser_id
    AND NOT EXISTS (
      SELECT 1 FROM group_members wm
      WHERE wm.contact_id = winner_id
        AND wm.group_id = lm.group_id
    );

  -- 8. Update winner with merged data
  UPDATE contacts SET
    avatar = COALESCE(winner_contact.avatar, loser_contact.avatar),
    first_name = COALESCE(winner_contact.first_name, loser_contact.first_name),
    last_name = COALESCE(winner_contact.last_name, loser_contact.last_name),
    first_seen = LEAST(COALESCE(winner_contact.first_seen, loser_contact.first_seen), COALESCE(loser_contact.first_seen, winner_contact.first_seen)),
    last_seen = GREATEST(COALESCE(winner_contact.last_seen, loser_contact.last_seen), COALESCE(loser_contact.last_seen, winner_contact.last_seen)),
    actor_id = COALESCE(winner_contact.actor_id, loser_contact.actor_id)
  WHERE id = winner_id;

  -- 9. Delete loser contact (cascades to channels, properties, contact_tags, group_members, intention_contacts)
  DELETE FROM contacts WHERE id = loser_id;

  RETURN winner_id;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."set_actor_id_default"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NEW.actor_id IS NULL THEN
    SELECT id INTO NEW.actor_id FROM actors WHERE user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- Event trigger functions

CREATE OR REPLACE FUNCTION "public"."handle_event_contact_created"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
    insert into public.events (action, target_type, target_id, actor_id, timestamp)
    values ('created', 'contact', new.id, new.actor_id, coalesce(new.first_seen, now()));
    return new;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."handle_event_group_created"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
    insert into public.events (action, target_type, target_id, actor_id, timestamp)
    values ('created', 'group', new.id, new.actor_id, coalesce(new.created_at, now()));
    return new;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."handle_event_intention_created"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
    insert into public.events (action, target_type, target_id, actor_id, timestamp)
    values ('created', 'intention', new.id, null, coalesce(new.created_at, now()));
    return new;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."handle_event_note_created"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
    insert into public.events (action, target_type, target_id, actor_id, timestamp, metadata)
    values ('noted', new.target_type, new.target_id, new.actor_id, coalesce(new.created_at, now()),
        jsonb_build_object('note_id', new.id));
    return new;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."handle_event_intention_status_changed"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
    if old.status is distinct from new.status then
        insert into public.events (action, target_type, target_id, actor_id, timestamp, metadata)
        values ('status_changed', 'intention', new.id, null, now(),
            jsonb_build_object('old_status', old.status, 'new_status', new.status));
    end if;
    return new;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."handle_event_group_member_joined"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
    insert into public.events (action, target_type, target_id, actor_id, timestamp, metadata)
    values ('joined', 'group', new.group_id, null, coalesce(new.joined_at, now()),
        jsonb_build_object('contact_id', new.contact_id));
    return new;
end;
$$;
