<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * - middle_name (optional; the sheet shows its initial)
 * - dropped_at: when a cadet was dropped (sheet leaves later sessions blank)
 * - active_since: when attendance (re)started; automatic absences only start after it,
 *   so a re-enrolled cadet is not marked absent for sessions missed while dropped.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared(<<<'SQL'
        ALTER TABLE public.user_info ADD COLUMN IF NOT EXISTS middle_name varchar(255);
        ALTER TABLE public.user_info ADD COLUMN IF NOT EXISTS dropped_at timestamptz;
        ALTER TABLE public.user_info ADD COLUMN IF NOT EXISTS active_since timestamptz;

        CREATE OR REPLACE FUNCTION public.mark_absent_cadets() RETURNS integer
        LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
        DECLARE inserted integer;
        BEGIN
            INSERT INTO attendance_records (user_id, session_id, status, date_added)
            SELECT u.user_id, s.session_id, 'absent', now()
            FROM formation_sessions s
            JOIN formations_event f ON f.formation_id = s.formation_id
            CROSS JOIN user_info u
            JOIN role_list r ON r.role_id = u.role_id
            WHERE ((f.formation_date + s.end_time) AT TIME ZONE 'Asia/Manila') <= now()
              AND u.status = 'active'
              AND lower(r.role_name) IN ('cadet', 'aspirant')
              AND COALESCE(u.active_since, u.date_added) <= ((f.formation_date + s.end_time) AT TIME ZONE 'Asia/Manila')
            ON CONFLICT (user_id, session_id) DO NOTHING;
            GET DIAGNOSTICS inserted = ROW_COUNT;
            RETURN inserted;
        END $fn$;
        REVOKE EXECUTE ON FUNCTION public.mark_absent_cadets() FROM PUBLIC;
        DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
                REVOKE EXECUTE ON FUNCTION public.mark_absent_cadets() FROM anon, authenticated;
            END IF;
        END $$;
        SQL);
    }

    public function down(): void
    {
        DB::unprepared(<<<'SQL'
        ALTER TABLE public.user_info DROP COLUMN IF EXISTS middle_name;
        ALTER TABLE public.user_info DROP COLUMN IF EXISTS dropped_at;
        ALTER TABLE public.user_info DROP COLUMN IF EXISTS active_since;
        SQL);
    }
};
