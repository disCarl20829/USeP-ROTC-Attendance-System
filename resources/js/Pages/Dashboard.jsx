import { useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import {
    UsersIcon,
    CalendarDaysIcon,
    ClipboardDocumentCheckIcon,
    ExclamationTriangleIcon,
    ArrowTrendingUpIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard({ cadet = {}, statsData = {}, recentActivity = [], upcomingEvents = [] }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const qrImageRef = useRef(null);

    const qrValue = cadet?.qrCodeValue || cadet?.student_id || 'CADET-0000';
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrValue)}`;

    const handleDownloadQR = async () => {
        try {
            const response = await fetch(qrImageUrl);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `ROTC_QR_${cadet.student_id || 'Cadet'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Failed to download QR code:', error);
        }
    };

    // Dynamic Stat Cards
    const stats = [
        { 
            name: 'Total Cadets', 
            value: statsData?.totalCadets ?? 0, 
            icon: UsersIcon, 
            change: 'Active Cadets', 
            changeType: 'positive' 
        },
        { 
            name: 'Active Events', 
            value: statsData?.activeEvents ?? 0, 
            icon: CalendarDaysIcon, 
            change: 'Scheduled', 
            changeType: 'positive' 
        },
        { 
            name: 'Attendance Rate', 
            value: statsData?.attendanceRate ?? '0%', 
            icon: ClipboardDocumentCheckIcon, 
            change: 'Today', 
            changeType: 'positive' 
        },
        { 
            name: 'Absent Today', 
            value: statsData?.absentToday ?? 0, 
            icon: ExclamationTriangleIcon, 
            change: 'Unexcused', 
            changeType: 'negative' 
        },
    ];

    return (
        <AuthenticatedLayout header="Dashboard">
            <Head title="Dashboard" />

            {/* Stats Grid */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <div key={stat.name} className="stat-card p-5 bg-white shadow rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                                <p className="mt-1 text-3xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#7B1E1E]/10">
                                <stat.icon className="h-6 w-6 text-[#7B1E1E]" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <ArrowTrendingUpIcon className={`mr-1 h-4 w-4 ${stat.changeType === 'negative' ? 'rotate-180 text-red-500' : 'text-green-500'}`} />
                            <span className={stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}>
                                {stat.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Personal Digital Attendance QR Pass Card */}
                <div className="card p-6 bg-white shadow rounded-lg border border-gray-200 flex flex-col items-center text-center">
                    <div className="w-full border-b pb-3 mb-4 flex items-center justify-between">
                        <span className="text-xs font-bold text-[#7B1E1E] uppercase tracking-wider">ROTC Digital ID Pass</span>
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">ACTIVE</span>
                    </div>

                    <div className="p-3 bg-white border-2 border-dashed border-gray-300 rounded-xl mb-4 shadow-inner">
                        <img 
                            ref={qrImageRef}
                            src={qrImageUrl} 
                            alt={`QR Code for ${cadet.student_id}`}
                            className="w-44 h-44 object-contain rounded-lg" 
                        />
                    </div>

                    <h3 className="text-lg font-bold text-gray-900">{cadet.name || user?.name}</h3>
                    <p className="text-sm font-mono text-gray-600 font-semibold">{cadet.student_id}</p>
                    <p className="text-xs text-gray-500 mt-1">{cadet.course} • Platoon: {cadet.platoon}</p>

                    <button
                        onClick={handleDownloadQR}
                        className="mt-5 w-full flex items-center justify-center gap-2 bg-[#7B1E1E] hover:bg-[#5C1515] text-white text-xs font-semibold py-2.5 px-4 rounded-lg shadow transition"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        Download QR Code (PNG)
                    </button>
                </div>

                {/* Recent Activity Table */}
                <div className="card lg:col-span-2 bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                        <p className="text-sm text-gray-500">Today's attendance records</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    <th className="px-6 py-3">Cadet</th>
                                    <th className="px-6 py-3">Event</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {recentActivity.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="py-6 text-center text-sm text-gray-500">
                                            No attendance records logged for today.
                                        </td>
                                    </tr>
                                ) : (
                                    recentActivity.map((record) => (
                                        <tr key={record.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{record.cadet}</td>
                                            <td className="px-6 py-4 text-gray-600">{record.event}</td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                        record.status === 'present'
                                                            ? 'bg-green-100 text-green-700'
                                                            : record.status === 'late'
                                                            ? 'bg-yellow-100 text-yellow-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}
                                                >
                                                    {record.status === 'present' && <CheckCircleIcon className="h-3 w-3" />}
                                                    {record.status === 'absent' && <XCircleIcon className="h-3 w-3" />}
                                                    {record.status === 'late' && <ClockIcon className="h-3 w-3" />}
                                                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 font-mono text-xs">{record.time}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Upcoming Events Section */}
            <div className="mt-6 card bg-white shadow rounded-lg border border-gray-200">
                <div className="border-b border-gray-100 px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
                    <p className="text-sm text-gray-500">Next scheduled ROTC activities</p>
                </div>
                <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
                    {upcomingEvents.length === 0 ? (
                        <p className="col-span-full text-center text-sm text-gray-500 py-4">No upcoming events scheduled.</p>
                    ) : (
                        upcomingEvents.map((event) => {
                            const dateParts = event.date.split(' ');
                            return (
                                <div key={event.id} className="flex gap-4 rounded-lg border border-gray-100 p-4 transition-colors hover:border-[#7B1E1E]/20 hover:bg-[#7B1E1E]/5">
                                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-[#7B1E1E] text-white">
                                        <span className="text-xs font-medium">{dateParts[0]}</span>
                                        <span className="text-lg font-bold leading-none">{dateParts[1]?.replace(',', '')}</span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-gray-900">{event.name}</p>
                                        <p className="text-sm text-gray-500">{event.time} • {event.location}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}