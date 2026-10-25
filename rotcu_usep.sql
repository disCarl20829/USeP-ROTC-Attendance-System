-- USeP Formation & QR Attendance System
-- Run in Supabase SQL Editor on a NEW project/schema.
-- Review the notes after this script before enabling production signup.

create extension if not exists pgcrypto;

-- =========================================================
-- 1. LOOKUP / REFERENCE TABLES
-- =========================================================

create table if not exists public.campus_list (
  campus_id bigint generated always as identity primary key,
  campus_name text not null unique,
  added_by uuid references auth.users(id) on delete set null,
  date_added timestamptz not null default now()
);

create table if not exists public.course_list (
  course_id bigint generated always as identity primary key,
  course_name text not null unique,
  added_by uuid references auth.users(id) on delete set null,
  date_added timestamptz not null default now()
);

create table if not exists public.platoon_list (
  platoon_id bigint generated always as identity primary key,
  platoon_name text not null unique,
  added_by uuid references auth.users(id) on delete set null,
  date_added timestamptz not null default now()
);

-- These are organizational ranks, not Supabase Auth roles.
create table if not exists public.role_list (
  role_id bigint generated always as identity primary key,
  role_name text not null unique,
  added_by uuid references auth.users(id) on delete set null,
  date_added timestamptz not null default now()
);

create table if not exists public.permission_list (
  permission_id bigint generated always as identity primary key,
  permission_name text not null unique,
  description text,
  date_added timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_id bigint not null references public.role_list(role_id) on delete cascade,
  permission_id bigint not null references public.permission_list(permission_id) on delete cascade,
  date_added timestamptz not null default now(),
  primary key (role_id, permission_id)
);

-- =========================================================
-- 2. USERS / PROFILES
-- Supabase Auth owns passwords and login credentials.
-- user_id must equal auth.users.id; never store passwords here.
-- =========================================================

create table if not exists public.user_info (
  info_id bigint generated always as identity primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  campus_id bigint not null references public.campus_list(campus_id),
  course_id bigint not null references public.course_list(course_id),
  role_id bigint not null references public.role_list(role_id),
  platoon_id bigint not null references public.platoon_list(platoon_id),
  placement smallint not null check (placement in (1, 2, 3)),
  is_system_admin boolean not null default false,
  date_added timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_info_email_domain check (
    lower(trim(email)) ~ '^[^@[:space:]]+@usep[.]edu[.]ph$'
  )
);


create index if not exists user_info_campus_idx on public.user_info(campus_id);
create index if not exists user_info_course_idx on public.user_info(course_id);
create index if not exists user_info_role_idx on public.user_info(role_id);
create index if not exists user_info_platoon_idx on public.user_info(platoon_id);

-- Enforce the exact email domain in Supabase Auth itself.
-- This rejects non-USeP addresses even if someone bypasses the frontend.
CREATE OR REPLACE FUNCTION public.enforce_usep_email_domain()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.email IS NULL
       OR NEW.email !~* '^[^@]+@usep\.edu\.ph$'
    THEN
        RAISE EXCEPTION
            'Only @usep.edu.ph email addresses are allowed.';
    END IF;

    RETURN NEW;
END;
$$;

drop trigger if exists enforce_usep_email_domain_trigger on auth.users;
create trigger enforce_usep_email_domain_trigger
before insert or update of email on auth.users
for each row execute function public.enforce_usep_email_domain();

-- Keep the profile email aligned with the Auth email.
create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.user_info
     set email = new.email,
         updated_at = now()
   where user_id = new.id;
  return new;
end;
$$;

drop trigger if exists sync_profile_email_trigger on auth.users;
create trigger sync_profile_email_trigger
after update of email on auth.users
for each row execute function public.sync_profile_email();

-- =========================================================
-- 3. FORMATIONS, SESSIONS, ATTENDANCE, QR, SETTINGS
-- =========================================================

create table if not exists public.formations_event (
  formation_id bigint generated always as identity primary key,
  formation_name text not null,
  formation_date date not null,
  formation_type text not null check (formation_type in ('whole_day', 'half_day')),
  created_by uuid not null references auth.users(id) on delete restrict,
  date_added timestamptz not null default now()
);

create table if not exists public.formation_sessions (
  session_id bigint generated always as identity primary key,
  formation_id bigint not null references public.formations_event(formation_id) on delete cascade,
  session_type text not null check (session_type in ('morning', 'afternoon')),
  start_time time not null,
  end_time time not null,
  late_time time not null,
  date_added timestamptz not null default now(),
  constraint session_time_order check (start_time < end_time),
  constraint unique_formation_session unique (formation_id, session_type)
);

create table if not exists public.attendance_qr (
  qr_id bigint generated always as identity primary key,
  user_id uuid not null unique references public.user_info(user_id) on delete cascade,
  qr_token uuid not null unique default gen_random_uuid(),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.attendance_records (
  record_id bigint generated always as identity primary key,
  user_id uuid not null references public.user_info(user_id) on delete cascade,
  session_id bigint not null references public.formation_sessions(session_id) on delete cascade,
  time_in timestamptz,
  time_out timestamptz,
  time_in_scanned_by uuid references auth.users(id) on delete set null,
  time_out_scanned_by uuid references auth.users(id) on delete set null,
  status text not null default 'present' check (status in ('present', 'late', 'absent')),
  date_added timestamptz not null default now(),
  constraint one_attendance_record_per_session unique (user_id, session_id),
  constraint time_out_after_time_in check (
    time_in is null or time_out is null or time_out >= time_in
  )
);

create index if not exists attendance_records_session_idx
  on public.attendance_records(session_id);
create index if not exists attendance_records_user_idx
  on public.attendance_records(user_id);

create table if not exists public.utilities (
  id smallint primary key default 1 check (id = 1),
  default_start_time time not null default '08:00',
  default_end_time time not null default '17:00',
  default_late_time time not null default '08:15',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint default_time_order check (default_start_time < default_end_time)
);

insert into public.utilities (id)

-- =========================================================
-- 4. QR ATTEDANCE RECORDS (LAST-ADDED)
-- =========================================================
CREATE TABLE public.attendance_records (
    record_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id uuid NOT NULL
        REFERENCES public.user_info(user_id)
        ON DELETE CASCADE,

    session_id bigint NOT NULL
        REFERENCES public.formation_sessions(session_id)
        ON DELETE CASCADE,

    time_in timestamptz,
    time_out timestamptz,

    time_in_scanned_by uuid
        REFERENCES auth.users(id)
        ON DELETE SET NULL,

    time_out_scanned_by uuid
        REFERENCES auth.users(id)
        ON DELETE SET NULL,

    status text NOT NULL DEFAULT 'present'
        CHECK (status IN ('present', 'late', 'absent')),

    date_added timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT one_attendance_record_per_session
        UNIQUE (user_id, session_id),

    CONSTRAINT time_out_after_time_in
        CHECK (
            time_in IS NULL
            OR time_out IS NULL
            OR time_out >= time_in
        )
);

CREATE INDEX attendance_records_session_idx
    ON public.attendance_records(session_id);

CREATE INDEX attendance_records_user_idx
    ON public.attendance_records(user_id);

ALTER TABLE public.attendance_records
    ENABLE ROW LEVEL SECURITY;