<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Student identification (accepts either user_id or student_id_number from scanner)
            'user_id' => ['nullable', 'uuid', 'exists:users,id'],
            'student_id_number' => ['required_without:user_id', 'string'],
            'student_id' => ['nullable', 'string'],

            // Session lookup
            'session_id' => ['required', 'integer'],

            // Live scan mode ('In' / 'Out' or 'in' / 'out')
            'scan_type' => ['nullable', 'string', 'in:In,Out,in,out'],
            'type' => ['nullable', 'string', 'in:in,out,In,Out'],

            // Manual attendance & timestamp fields
            'time_in' => ['nullable', 'date'],
            'time_out' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'in:present,late,absent,Present,Late,Absent'],
            'scanned_by' => ['nullable', 'string'],
        ];
    }

    /**
     * Prepare inputs before running validation.
     */
    protected function prepareForValidation(): void
    {
        // Default status to 'present' if scan payload is processed
        if (!$this->has('status') && ($this->has('student_id_number') || $this->has('student_id'))) {
            $this->merge([
                'status' => 'present',
            ]);
        }
    }
}