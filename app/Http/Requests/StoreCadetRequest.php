<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCadetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'uuid'],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'regex:^[^@[:space:]]+@usep[.]edu[.]ph$'],
            'campus_id' => ['required', 'integer'],
            'course_id' => ['required', 'integer'],
            'role_id' => ['required', 'integer'],
            'platoon_id' => ['required', 'integer'],
            'placement' => ['required', 'integer', 'in:1,2,3'],
            'is_system_admin' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.required' => 'The cadet user ID is required.',
            'email.regex' => 'The email must be a valid USeP email address ending in @usep.edu.ph.',
        ];
    }
}
