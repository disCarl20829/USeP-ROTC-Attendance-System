import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { UsersIcon, CalendarDaysIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import CadetQrCode from '@/Components/CadetQrCode';
import MyAttendance from '@/Components/MyAttendance';
import StatusBadge from '@/Components/StatusBadge';

export default function Dashboard({ profile = {}, myAttendance = null, overview = null, upcomingEvents = [], points = {} }) {
    const today = overview?.today ?? {};

    return (
        <AuthenticatedLayout header="Dashboard">
            <Head title="Dashboard" />

            {overview && (
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard icon={UsersIcon} label="Active cadets" value={overview.totalCadets} />
                    <StatCard icon={CalendarDaysIcon} label="Upcoming events" value={overview.upcomingEvents} />
                    <StatCard
                        icon={CheckCircleIcon}
                        label="Today: present / late"
                        value={`${today.present ?? 0} / ${today.late ?? 0}`}
                    />
                    <StatCard
                        icon={ExclamationTriangleIcon}
                        label="Today: absent / excused"
                        value={`${today.absent ?? 0} / ${today.excused ?? 0}`}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Profile + QR */}
                <div className="card p-6 lg:col-span-1">
                    <div className="mb-4 text-center">
                        <h2 className="text-lg font-bold text-gray-900">{profile.name}</h2>
                        <p className="font-mono text-sm font-semibold text-gray-600">{profile.student_id}</p>
                        <p className="mt-1 text-xs text-gray-500">
                            {profile.role} · {profile.course ?? 'No course'}
                        </p>
                        <p className="text-xs text-gray-500">
                            Platoon {profile.platoon} · {profile.specialization}
                        </p>
                        {profile.status === 'dropped' && (
                            <p className="mt-2 rounded-lg bg-rose-50 p-2 text-xs font-semibold text-rose-700">
                                You are marked as DROPPED. Your QR code cannot be scanned.
                            </p>
                        )}
                    </div>
                    <CadetQrCode value={profile.qr_token} studentId={profile.student_id} name={profile.name} size={200} />
                </div>

                {/* My attendance */}
                <div className="lg:col-span-2">
                    <MyAttendance summary={myAttendance} points={points} />
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {overview && (
                    <div className="card p-6 lg:col-span-2">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Recent scans</h2>
                            <Link href={route('attendance')} className="text-sm font-semibold text-[#7B1E1E] hover:underline">
                                View roster
                            </Link>
                        </div>
                        {overview.recentActivity.length === 0 ? (
                            <p className="py-6 text-center text-sm text-gray-400">No scans yet.</p>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {overview.recentActivity.map((r) => (
                                    <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-gray-900">{r.cadet}</p>
                                            <p className="truncate text-xs text-gray-500">{r.event}</p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-3">
                                            <span className="font-mono text-xs text-gray-500">{r.time}</span>
                                            <StatusBadge status={r.status} />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                <div className={`card p-6 ${overview ? '' : 'lg:col-span-3'}`}>
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">Upcoming events</h2>
                    {upcomingEvents.length === 0 ? (
                        <p className="py-6 text-center text-sm text-gray-400">No upcoming formations.</p>
                    ) : (
                        <ul className="space-y-3">
                            {upcomingEvents.map((e) => (
                                <li key={e.id} className="rounded-xl border border-gray-100 p-3">
                                    <p className="text-sm font-semibold text-gray-900">{e.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {e.date} · {e.time}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function StatCard({ icon: Icon, label, value }) {
    return (
        <div className="card flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7B1E1E]/10">
                <Icon className="h-6 w-6 text-[#7B1E1E]" />
            </div>
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
}
