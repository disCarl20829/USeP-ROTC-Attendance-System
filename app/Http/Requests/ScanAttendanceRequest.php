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
            'student_id_number' => ['required', 'string'],
            'student_id'        => ['nullable', 'string'],
            'session_id'        => ['required', 'integer', 'exists:formation_sessions,session_id'],
            'scan_type'         => ['required_without:type', 'string', 'in:In,Out,in,out'],
            'type'              => ['required_without:scan_type', 'string', 'in:In,Out,in,out'],
            'scanned_by'        => ['required', 'string'],
        ];
    }

    /**
     * Normalize inputs before validation runs.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('scan_type') || $this->has('type')) {
            $rawType = $this->input('scan_type', $this->input('type'));
            $normalizedType = ucfirst(strtolower($rawType)); // 'in' -> 'In', 'out' -> 'Out'

            $this->merge([
                'scan_type' => $normalizedType,
                'type'      => strtolower($normalizedType),
            ]);
        }
    }
}