import StatusBadge from '@/Components/StatusBadge';

/** The logged-in user's own attendance: totals, points and recent sessions. */
export default function MyAttendance({ summary, points = {} }) {
    if (!summary) return null;

    const { counts = {}, history = [] } = summary;
    const tiles = [
        { key: 'present', label: 'Present', color: 'text-emerald-700 bg-emerald-50' },
        { key: 'late', label: 'Late', color: 'text-amber-700 bg-amber-50' },
        { key: 'excused', label: 'Excused', color: 'text-sky-700 bg-sky-50' },
        { key: 'absent', label: 'Absent', color: 'text-rose-700 bg-rose-50' },
    ];

    return (
        <div className="card p-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">My attendance</h2>
                    <p className="text-xs text-gray-500">
                        Present {points.present} · Late {points.late} · Excused {points.excused} · Absent {points.absent} pts
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-gray-900">
                        {summary.points}
                        <span className="text-sm font-semibold text-gray-400"> / {summary.max_points} pts</span>
                    </p>
                    <p className="text-xs text-gray-500">
                        {summary.rate === null ? 'No sessions recorded yet' : `${summary.rate}% attendance`}
                    </p>
                </div>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {tiles.map((t) => (
                    <div key={t.key} className={`rounded-xl p-3 text-center ${t.color}`}>
                        <p className="text-2xl font-bold">{counts[t.key] ?? 0}</p>
                        <p className="text-xs font-semibold uppercase tracking-wide">{t.label}</p>
                    </div>
                ))}
            </div>

            {counts.absent >= 3 && (
                <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-700">
                    You have {counts.absent} absences. Talk to your platoon leader.
                </p>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                            <th className="py-2 pr-3">Session</th>
                            <th className="py-2 pr-3">Status</th>
                            <th className="py-2 pr-3">In / Out</th>
                            <th className="py-2 text-right">Pts</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {history.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-6 text-center text-gray-400">
                                    No sessions yet.
                                </td>
                            </tr>
                        ) : (
                            history.map((h) => (
                                <tr key={h.session_id}>
                                    <td className="py-2 pr-3 text-gray-900">{h.label}</td>
                                    <td className="py-2 pr-3">
                                        <StatusBadge status={h.status} />
                                    </td>
                                    <td className="whitespace-nowrap py-2 pr-3 font-mono text-xs text-gray-600">
                                        <span className="block">{h.time_in ?? '--:--'}</span>
                                        <span className="block text-gray-400">{h.time_out ?? '--:--'}</span>
                                    </td>
                                    <td className="py-2 text-right font-mono font-semibold">{h.points ?? '—'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
