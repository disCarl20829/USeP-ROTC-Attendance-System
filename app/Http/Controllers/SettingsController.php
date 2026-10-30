<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\UserInfo;
use App\Models\Utility;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index(Request $request)
    {
        // Fetch existing system utility configuration or create default row
        $utility = Utility::firstOrCreate([], [
            'default_start_time' => '08:00',
            'default_end_time'   => '17:00',
            'default_late_time'  => '08:15',
        ]);

        // Retrieve logged-in user profile from database
        $authUser = $request->user();
        $userInfo = null;

        if ($authUser) {
            $userInfo = UserInfo::where('user_id', $authUser->id)
                ->orWhere('email', $authUser->email)
                ->first();
        }

        $userPayload = [
            'id'         => $authUser?->id ?? $userInfo?->user_id ?? '',
            'first_name' => $userInfo?->first_name ?? '',
            'last_name'  => $userInfo?->last_name ?? '',
            'email'      => $authUser?->email ?? $userInfo?->email ?? '',
        ];

        return Inertia::render('Settings', [
            'utility' => $utility,
            'user'    => $userPayload,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'default_start_time' => 'nullable|string',
            'default_end_time'   => 'nullable|string',
            'default_late_time'  => 'nullable|string',
        ]);

        $utility = Utility::firstOrCreate([], [
            'default_start_time' => '08:00',
            'default_end_time'   => '17:00',
            'default_late_time'  => '08:15',
        ]);

        $utility->update($validated);

        return redirect()->back()->with('success', 'System settings updated successfully!');
    }
}