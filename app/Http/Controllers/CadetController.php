<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCadetRequest;
use App\Http\Requests\UpdateCadetRequest;
use App\Models\AttendanceQr;
use App\Models\UserInfo;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CadetController extends Controller
{
    public function index()
    {
        $cadets = UserInfo::with(['campus', 'course', 'role', 'platoon'])->get();

        return response()->json($cadets);
    }

    public function store(StoreCadetRequest $request)
    {
        $validated = $request->validated();

        $cadet = UserInfo::create($validated);

        AttendanceQr::create([
            'user_id' => $cadet->user_id,
            'qr_token' => (string) Str::uuid(),
            'is_active' => true,
        ]);

        return response()->json($cadet->load(['campus', 'course', 'role', 'platoon', 'attendanceQr']), 201);
    }

    public function update(UpdateCadetRequest $request, $id)
    {
        $cadet = UserInfo::findOrFail($id);

        $cadet->update($request->validated());

        return response()->json($cadet->load(['campus', 'course', 'role', 'platoon']));
    }

    public function destroy($id)
    {
        $cadet = UserInfo::findOrFail($id);
        $cadet->delete();

        return response()->json(null, 204);
    }
}
