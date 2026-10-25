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
            'user_id' => ['required', 'uuid'],
            'session_id' => ['required', 'integer'],
            'time_in' => ['nullable', 'date'],
            'time_out' => ['nullable', 'date'],
            'status' => ['required', 'in:present,late,absent'],
        ];
    }
}
