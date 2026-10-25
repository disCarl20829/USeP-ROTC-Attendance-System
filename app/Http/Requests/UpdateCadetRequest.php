<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCadetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'regex:^[^@[:space:]]+@usep[.]edu[.]ph$'],
            'campus_id' => ['sometimes', 'integer'],
            'course_id' => ['sometimes', 'integer'],
            'role_id' => ['sometimes', 'integer'],
            'platoon_id' => ['sometimes', 'integer'],
            'placement' => ['sometimes', 'integer', 'in:1,2,3'],
            'is_system_admin' => ['boolean'],
        ];
    }
}
