<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ScanAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'qr_token' => ['required', 'uuid'],
            'session_id' => ['required', 'integer', 'exists:formation_sessions,session_id'],
            'scanned_by' => ['required', 'uuid'],
        ];
    }
}
