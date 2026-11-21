<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ScanAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // permission:scan middleware guards the route
    }

    public function rules(): array
    {
        return [
            // QR token (UUID) from a cadet's QR code, or a typed student ID.
            'code'       => ['required', 'string', 'max:100'],
            'session_id' => ['required', 'integer', 'exists:formation_sessions,session_id'],
            'scan_type'  => ['required', 'string', 'in:in,out,In,Out'],
        ];
    }
}
