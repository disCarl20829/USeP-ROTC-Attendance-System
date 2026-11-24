import { router } from '@inertiajs/react';

/** Admin: numbered platoons per platoon (Golf 1st, Golf 2nd, …). */
export default function PlatoonUnitsPanel({ platoons = [] }) {
    const add = (p) => router.post(route('platoon-units.store', p.platoon_id), {}, { preserveScroll: true });
    const remove = (p, u) =>
        confirm(`Remove ${p.name} ${u.label}?`) &&
        router.delete(route('platoon-units.destroy', u.unit_id), { preserveScroll: true });

    return (
        <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900">Platoon numbers</h2>
            <p className="mb-5 text-sm text-gray-500">
                Numbers available in each platoon (e.g. Golf 1st, Golf 2nd). Cadets choose one when they sign up. A number
                can only be removed when nobody is assigned to it.
            </p>

            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {platoons.map((p) => (
                    <li key={p.platoon_id} className="flex flex-wrap items-center gap-3 p-3">
                        <span className="w-24 shrink-0 font-semibold text-gray-900">{p.name}</span>
                        <div className="flex flex-1 flex-wrap gap-2">
                            {p.units.length === 0 && <span className="text-sm text-gray-400">No numbers yet</span>}
                            {p.units.map((u) => (
                                <span
                                    key={u.unit_id}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 py-1 pl-2.5 pr-1 text-sm"
                                >
                                    <span className="font-medium text-gray-800">{u.label}</span>
                                    <span className="text-xs text-gray-500">· {u.members} {u.members === 1 ? "member" : "members"}</span>
                                    <button
                                        type="button"
                                        onClick={() => remove(p, u)}
                                        disabled={u.members > 0}
                                        title={u.members > 0 ? 'Move its members first' : `Remove ${p.name} ${u.label}`}
                                        aria-label={`Remove ${p.name} ${u.label}`}
                                        className="rounded px-1.5 text-gray-400 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                        <button type="button" onClick={() => add(p)} className="btn-secondary px-3 py-1.5 text-xs">
                            Add number
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
