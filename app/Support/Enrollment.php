<?php

namespace App\Support;

use App\Models\SchoolYear;

/**
 * Who may register as a cadet: first years of the active school year only.
 *  - student ID format YYYY-NNNNN, where YYYY = the active year's enrollment year
 *  - the USeP email must end with the same number (caupepito00107 <-> 2020-00107)
 */
class Enrollment
{
    public const ID_PATTERN = '/^(\d{4})-(\d{4,6})$/';

    /** Returns an error message, or null when the student ID is allowed for this email. */
    public static function checkStudent(string $studentId, string $email): ?string
    {
        $year = SchoolYear::active();

        if (!$year) {
            return 'Registration is closed: there is no active school year. Contact an ROTC officer.';
        }

        if (!preg_match(self::ID_PATTERN, trim($studentId), $m)) {
            return 'Use your student ID in the format YYYY-NNNNN (e.g. ' . $year->enrollment_year . '-00123).';
        }

        if ((int) $m[1] !== (int) $year->enrollment_year) {
            return "Only first-year students (IDs starting with {$year->enrollment_year}-) can register as cadets for {$year->name}.";
        }

        $local = strtolower((string) strstr($email, '@', true));
        if (!preg_match('/(\d+)$/', $local, $e) || ltrim($e[1], '0') !== ltrim($m[2], '0')) {
            return 'Your student ID must match your USeP email (the number at the end of your email).';
        }

        return null;
    }

    /** Validation rule closure for student_id. */
    public static function rule(string $email): \Closure
    {
        return function ($attribute, $value, $fail) use ($email) {
            if ($message = self::checkStudent((string) $value, $email)) {
                $fail($message);
            }
        };
    }
}
