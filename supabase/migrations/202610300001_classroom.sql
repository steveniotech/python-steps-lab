begin;

create table public.lab_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 username text not null unique check (username ~ '^[a-z0-9][a-z0-9_-]{2,31}$'),
 display_name text not null check (length(display_name) between 1 and 60),
 role text not null check (role in ('student','teacher')),
 teacher_id uuid,
 -- Constant generated value prevents callers from selecting a non-teacher target.
 teacher_role text generated always as ('teacher'::text) stored,
 constraint lab_profiles_user_role unique (user_id,role),
 constraint lab_profiles_teacher_role foreign key (teacher_id,teacher_role)
  references public.lab_profiles(user_id,role) on update restrict on delete restrict,
 created_at timestamptz not null default now(),
 check ((role = 'student' and teacher_id is not null) or (role = 'teacher' and teacher_id is null))
);
create index lab_profiles_teacher on public.lab_profiles(teacher_id);

create function public.lab_is_teacher() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.lab_profiles where user_id = (select auth.uid()) and role = 'teacher');
$$;
revoke all on function public.lab_is_teacher() from public, anon;
grant execute on function public.lab_is_teacher() to authenticated;

create function public.lab_valid_state(value jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare
 step_id text; item jsonb; field text; reply jsonb;
 ids constant text[] := array['talk-1','talk-2','talk-3','talk-4','talk-5','store-1','store-2','store-3','store-4','store-5','math-1','math-2','math-3','math-4','math-5','robot-1','decisions-1','decisions-2','decisions-3','decisions-4','decisions-5','decisions-6','loops-1','loops-2','loops-3','loops-4','loops-5','loops-6','guess-1'];
begin
 if jsonb_typeof(value) is distinct from 'object' or octet_length(value::text) > 2000000 then return false; end if;
 if value->'version' is distinct from '1'::jsonb or not (value->>'currentStep' = any(ids)) or (value->>'currentStep') is null
    or (value->>'view') is null or value->>'view' not in ('map','lesson') or jsonb_typeof(value->'steps') is distinct from 'object' then return false; end if;
 if exists(select 1 from jsonb_object_keys(value) k where k not in ('version','currentStep','view','steps')) then return false; end if;
 for step_id,item in select * from jsonb_each(value->'steps') loop
  if not (step_id = any(ids)) or jsonb_typeof(item) is distinct from 'object' then return false; end if;
  if exists(select 1 from jsonb_object_keys(item) k where k not in ('draft','completed','completions','hints','hintClicks','stage','inputs','lastError','artifact')) then return false; end if;
  if jsonb_typeof(item->'completed') is distinct from 'boolean' then return false; end if;
  foreach field in array array['draft','lastError','artifact'] loop
   if jsonb_typeof(item->field) is distinct from 'string' or length(item->>field)>12000 then return false; end if;
  end loop;
  foreach field in array array['completions','hintClicks','hints','stage'] loop
   if jsonb_typeof(item->field) is distinct from 'number' then return false; end if;
   if (item->>field)::numeric < 0 or (item->>field)::numeric > (case when field in ('hints','stage') then 3 else 100000 end)
      or trunc((item->>field)::numeric) <> (item->>field)::numeric then return false; end if;
  end loop;
  if jsonb_typeof(item->'inputs') is distinct from 'array' then return false; end if;
  if jsonb_array_length(item->'inputs')>100 then return false; end if;
  for reply in select * from jsonb_array_elements(item->'inputs') loop
   if jsonb_typeof(reply) is distinct from 'string' or length(reply #>> '{}')>200 then return false; end if;
  end loop;
 end loop;
 return true;
end;
$$;
revoke all on function public.lab_valid_state(jsonb) from public, anon;
grant execute on function public.lab_valid_state(jsonb) to authenticated;

create table public.lab_progress (
 user_id uuid primary key references public.lab_profiles(user_id) on delete cascade,
 state jsonb not null check (public.lab_valid_state(state)),
 revision bigint not null check (revision > 0),
 updated_at timestamptz not null default now()
);
alter table public.lab_profiles enable row level security;
alter table public.lab_progress enable row level security;
create policy profiles_read on public.lab_profiles for select to authenticated
 using (user_id = (select auth.uid()) or (teacher_id = (select auth.uid()) and public.lab_is_teacher()));
create policy progress_read on public.lab_progress for select to authenticated
 using (user_id = (select auth.uid()) or exists (
  select 1 from public.lab_profiles p where p.user_id = lab_progress.user_id and p.teacher_id = (select auth.uid()) and public.lab_is_teacher()
 ));
revoke all on public.lab_profiles, public.lab_progress from anon, authenticated;
grant select on public.lab_profiles, public.lab_progress to authenticated;
grant all on public.lab_profiles, public.lab_progress to service_role;

-- All writes use a compare-and-swap revision; direct inserts/updates are denied.
create function public.save_python_progress(p_state jsonb, p_revision bigint) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare caller uuid := (select auth.uid()); current_revision bigint; result jsonb;
begin
 if caller is null then raise sqlstate 'PT401' using message = 'Sign in required'; end if;
 -- Lock the profile as well, serializing two simultaneous first saves.
 perform 1 from public.lab_profiles where user_id = caller and role = 'student' for update;
 if not found then raise sqlstate 'PT403' using message = 'Student account required'; end if;
 if p_revision is null or p_revision < 0 or not public.lab_valid_state(p_state) then
  raise sqlstate 'PT400' using message = 'Invalid progress';
 end if;
 select revision into current_revision from public.lab_progress where user_id = caller for update;
 if coalesce(current_revision,0) <> p_revision then raise sqlstate 'PT409' using message = 'Progress changed on another device'; end if;
 insert into public.lab_progress(user_id,state,revision,updated_at) values(caller,p_state,p_revision+1,clock_timestamp())
 on conflict(user_id) do update set state=excluded.state,revision=excluded.revision,updated_at=excluded.updated_at;
 select jsonb_build_object('state',state,'revision',revision,'updated_at',updated_at) into result from public.lab_progress where user_id = caller;
 return result;
end;
$$;
revoke all on function public.save_python_progress(jsonb,bigint) from public, anon;
grant execute on function public.save_python_progress(jsonb,bigint) to authenticated;
commit;
