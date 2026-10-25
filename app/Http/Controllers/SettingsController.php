<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateUtilityRequest;
use App\Models\Utility;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index()
    {
        $utility = Utility::first();

        return response()->json($utility);
    }

    public function update(UpdateUtilityRequest $request)
    {
        $utility = Utility::firstOrCreate(['id' => 1], [
            'default_start_time' => '08:00',
            'default_end_time' => '17:00',
            'default_late_time' => '08:15',
        ]);

        $utility->update($request->validated());

        return response()->json($utility);
    }
}
