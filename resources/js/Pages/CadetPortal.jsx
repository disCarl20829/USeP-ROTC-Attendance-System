import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import CadetQrCode from '@/Components/CadetQrCode';
import MyAttendance from '@/Components/MyAttendance';

export default function CadetPortal({ profile = {}, myAttendance = null, upcomingEvents = [], points = {} }) {
    return (
        <AuthenticatedLayout header="My QR & Attendance">
            <Head title="My QR & Attendance" />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="card p-6 text-center">
                    <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                    <p className="font-mono text-sm font-semibold text-gray-600">{profile.student_id}</p>
                    <p className="mb-4 mt-1 text-xs text-gray-500">
                        {profile.course} · Platoon {profile.platoon} · {profile.specialization}
                    </p>
                    {profile.status === 'dropped' && (
                        <p className="mb-4 rounded-lg bg-rose-50 p-2 text-xs font-semibold text-rose-700">
                            You are marked as DROPPED. Your QR code cannot be scanned.
                        </p>
                    )}
                    <CadetQrCode value={profile.qr_token} studentId={profile.student_id} name={profile.name} size={260} />
                </div>

                <div className="space-y-6 lg:col-span-2">
                    <MyAttendance summary={myAttendance} points={points} />

                    <div className="card p-6">
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
            </div>
        </AuthenticatedLayout>
    );
}
