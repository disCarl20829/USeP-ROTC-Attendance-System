<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUtilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'default_start_time' => ['required', 'time'],
            'default_end_time' => ['required', 'time'],
            'default_late_time' => ['required', 'time'],
            'updated_by' => ['nullable', 'uuid'],
        ];
    }
}
