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
            'created_by' => ['required', 'uuid'],
            'sessions' => ['sometimes', 'array'],
            'sessions.*.session_type' => ['required', 'in:morning,afternoon'],
            'sessions.*.start_time' => ['required', 'time'],
            'sessions.*.end_time' => ['required', 'time'],
            'sessions.*.late_time' => ['required', 'time'],
        ];
    }
}
