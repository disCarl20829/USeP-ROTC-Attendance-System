<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Daily: if no school year is active and it is August–December (Manila), start the
 * next one automatically, reusing the month/day of the most recent year
 * (default Aug 1 – May 31). Closing a year stays manual (admin, with backup).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
        CREATE OR REPLACE FUNCTION public.ensure_school_year() RETURNS text
        LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
        DECLARE
            today  date := (now() AT TIME ZONE 'Asia/Manila')::date;
            y      int  := extract(year FROM today)::int;
            last   school_years%ROWTYPE;
            s_on   date;
            e_on   date;
            label  text;
        BEGIN
            IF EXISTS (SELECT 1 FROM school_years WHERE status = 'active') THEN
                RETURN NULL;
            END IF;

            SELECT * INTO last FROM school_years ORDER BY starts_on DESC LIMIT 1;

            -- Start month/day: last year's, else Aug 1. Only start once that day has come.
            s_on := make_date(y, COALESCE(extract(month FROM last.starts_on)::int, 8), COALESCE(extract(day FROM last.starts_on)::int, 1));
            IF today < s_on THEN
                RETURN NULL;
            END IF;

            -- This batch already had a school year (e.g. closed early): don't recreate it.
            IF EXISTS (SELECT 1 FROM school_years WHERE enrollment_year = y) THEN
                RETURN NULL;
            END IF;

            e_on := make_date(y + 1, COALESCE(extract(month FROM last.ends_on)::int, 5), COALESCE(extract(day FROM last.ends_on)::int, 31));
            label := y || '-' || (y + 1);

            INSERT INTO school_years (name, enrollment_year, starts_on, ends_on, status)
            VALUES (label, y, s_on, e_on, 'active');

            INSERT INTO audit_logs (action, details)
            VALUES ('school_year.auto_start', jsonb_build_object('name', label));

            RETURN label;
        END $fn$;

        REVOKE EXECUTE ON FUNCTION public.ensure_school_year() FROM PUBLIC;
        DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
                REVOKE EXECUTE ON FUNCTION public.ensure_school_year() FROM anon, authenticated;
            END IF;
            IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
                PERFORM cron.schedule('ensure-school-year', '5 16 * * *', 'SELECT public.ensure_school_year()'); -- 00:05 Manila
            END IF;
        END $$;
        SQL);
    }

    public function down(): void
    {
        DB::unprepared(<<<'SQL'
        DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
                PERFORM cron.unschedule('ensure-school-year');
            END IF;
        END $$;
        DROP FUNCTION IF EXISTS public.ensure_school_year();
        SQL);
    }
};
