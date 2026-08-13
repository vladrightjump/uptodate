-- Per-device study state for the qa-prep app: which questions you've marked
-- "known", and one free-text note per question.
--
-- There is no login. A browser generates a random uuid the first time it runs
-- the app, keeps it in localStorage, and sends it with every call. That uuid is
-- the whole identity, so it must never be guessable and must never be
-- enumerable — hence the design below:
--
--   * RLS is on and NO policies exist, so the anon key cannot read or write
--     these tables directly. A `select * from question_notes` returns nothing.
--   * All access goes through the security-definer functions at the bottom,
--     every one of which takes the device id as an argument. Without the uuid
--     you get an empty result, and the uuid cannot be listed from outside.
--
-- Anyone holding the anon key (it ships in the browser bundle) can still write
-- rows under device ids they invent. That is inherent to a keyless public app;
-- it costs storage, not privacy. Swap the device id for Supabase anonymous
-- auth if that ever matters.

create extension if not exists pgcrypto;

create table if not exists public.question_state (
  device_id   uuid        not null,
  -- Question ids are hand-authored short slugs in src/data (e.g. "a3").
  question_id text        not null check (char_length(question_id) between 1 and 64),
  known       boolean     not null default false,
  updated_at  timestamptz not null default now(),
  primary key (device_id, question_id)
);

create table if not exists public.question_notes (
  device_id   uuid        not null,
  question_id text        not null check (char_length(question_id) between 1 and 64),
  -- One note per question, so the question is part of the key. The ceiling is
  -- a sanity bound on a study note, not a product limit.
  body        text        not null check (char_length(body) between 1 and 5000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (device_id, question_id)
);

alter table public.question_state enable row level security;
alter table public.question_notes enable row level security;

-- Deliberately no policies. Belt and braces on top of that:
revoke all on table public.question_state from anon, authenticated;
revoke all on table public.question_notes from anon, authenticated;


-- ---------------------------------------------------------------------------
-- Access functions. All are security definer with a pinned search_path so a
-- caller cannot shadow `public` with their own tables.
-- ---------------------------------------------------------------------------

-- Everything the app needs on startup, in one round trip.
create or replace function public.qa_state_load(p_device uuid)
returns json
language sql
security definer
set search_path = public, pg_temp
as $$
  select json_build_object(
    'known', coalesce(
      (select json_agg(question_id order by question_id)
         from public.question_state
        where device_id = p_device and known),
      '[]'::json
    ),
    'notes', coalesce(
      (select json_agg(
                json_build_object(
                  'question_id', question_id,
                  'body', body,
                  'updated_at', updated_at
                ) order by question_id)
         from public.question_notes
        where device_id = p_device),
      '[]'::json
    )
  );
$$;

create or replace function public.qa_state_set_known(
  p_device uuid,
  p_question text,
  p_known boolean
)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into public.question_state (device_id, question_id, known, updated_at)
  values (p_device, p_question, p_known, now())
  on conflict (device_id, question_id)
  do update set known = excluded.known, updated_at = now();
$$;

-- "Reset progress" in the UI. Drops the rows rather than setting known=false,
-- so an abandoned device leaves nothing behind.
create or replace function public.qa_state_clear_known(p_device uuid)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  delete from public.question_state where device_id = p_device;
$$;

-- Upsert, because the UI only ever edits the single note a question has.
create or replace function public.qa_note_save(
  p_device uuid,
  p_question text,
  p_body text
)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into public.question_notes (device_id, question_id, body, updated_at)
  values (p_device, p_question, p_body, now())
  on conflict (device_id, question_id)
  do update set body = excluded.body, updated_at = now();
$$;

create or replace function public.qa_note_delete(p_device uuid, p_question text)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  delete from public.question_notes
   where device_id = p_device and question_id = p_question;
$$;

-- `public` includes every role; grant explicitly instead.
revoke all on function public.qa_state_load(uuid) from public;
revoke all on function public.qa_state_set_known(uuid, text, boolean) from public;
revoke all on function public.qa_state_clear_known(uuid) from public;
revoke all on function public.qa_note_save(uuid, text, text) from public;
revoke all on function public.qa_note_delete(uuid, text) from public;

grant execute on function public.qa_state_load(uuid) to anon, authenticated;
grant execute on function public.qa_state_set_known(uuid, text, boolean) to anon, authenticated;
grant execute on function public.qa_state_clear_known(uuid) to anon, authenticated;
grant execute on function public.qa_note_save(uuid, text, text) to anon, authenticated;
grant execute on function public.qa_note_delete(uuid, text) to anon, authenticated;
