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
            'student_id_number' => 'required|string',
            'session_id'        => 'required|integer|exists:formation_sessions,session_id',
            'scanned_by'        => 'required|string',
        ];
    }
}