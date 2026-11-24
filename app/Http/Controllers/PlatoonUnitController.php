<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Platoon;
use App\Models\PlatoonUnit;
use App\Models\UserInfo;
use Illuminate\Http\Request;

/** Admin: numbered platoons per platoon (Golf 1st, Golf 2nd, …). */
class PlatoonUnitController extends Controller
{
    public static function settingsProps(): array
    {
        $counts = UserInfo::whereNotNull('platoon_unit_id')
            ->selectRaw('platoon_unit_id, count(*) as n')->groupBy('platoon_unit_id')
            ->pluck('n', 'platoon_unit_id');

        return Platoon::orderBy('platoon_name')->get()->map(fn ($p) => [
            'platoon_id' => $p->platoon_id,
            'name'       => $p->platoon_name,
            'units'      => PlatoonUnit::where('platoon_id', $p->platoon_id)->orderBy('number')->get()
                ->map(fn ($u) => [
                    'unit_id' => $u->unit_id,
                    'label'   => PlatoonUnit::ordinal($u->number),
                    'members' => (int) ($counts[$u->unit_id] ?? 0),
                ])->values(),
        ])->values()->all();
    }

    /** Add the next free number (1st, 2nd, …) to a platoon. */
    public function store(Request $request, int $platoonId)
    {
        $platoon = Platoon::findOrFail($platoonId);
        $taken   = PlatoonUnit::where('platoon_id', $platoonId)->pluck('number')->all();
        $next    = 1;
        while (in_array($next, $taken, true)) {
            $next++;
        }

        if ($next > 20) {
            return back()->with('error', "{$platoon->platoon_name} already has 20 numbers.");
        }

        PlatoonUnit::create([
            'platoon_id' => $platoonId,
            'number'     => $next,
            'added_by'   => $request->session()->get('supabase_user_id'),
        ]);

        $label = "{$platoon->platoon_name} " . PlatoonUnit::ordinal($next);
        AuditLog::record($request, 'platoon_unit.add', ['name' => $label]);

        return back()->with('success', "{$label} added.");
    }

    public function destroy(Request $request, int $unitId)
    {
        $unit    = PlatoonUnit::with('platoon')->findOrFail($unitId);
        $members = UserInfo::withArchived()->where('platoon_unit_id', $unitId)->count();

        if ($members > 0) {
            return back()->with('error', "{$unit->label} still has {$members} member(s). Move them to another number first.");
        }

        $label = $unit->label;
        $unit->delete();
        AuditLog::record($request, 'platoon_unit.remove', ['name' => $label]);

        return back()->with('success', "{$label} removed.");
    }
}
