<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'formation_name' => ['required', 'string', 'max:255'],
            'formation_date' => ['required', 'date'],
            'formation_type' => ['required', 'in:whole_day,half_day'],
            'created_by' => ['nullable', 'uuid', 'exists:users,id'],
            'sessions' => ['sometimes', 'array'],
            'sessions.*.session_type' => ['required', 'in:morning,afternoon'],
            'sessions.*.start_time' => ['required', 'date_format:H:i'],
            'sessions.*.end_time' => ['required', 'date_format:H:i', 'after:sessions.*.start_time'],
            'sessions.*.late_time' => ['nullable', 'date_format:H:i'],
        ];
    }

    /**
     * Merge authenticated user ID if created_by is omitted from frontend payload.
     */
    protected function prepareForValidation(): void
    {
        if (!$this->has('created_by') && auth()->check()) {
            $this->merge([
                'created_by' => auth()->id(),
            ]);
        }
    }
}