import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import {
    UsersIcon,
    CalendarDaysIcon,
    ClipboardDocumentCheckIcon,
    ExclamationTriangleIcon,
    ArrowTrendingUpIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard({ statsData, recentActivity = [], upcomingEvents = [] }) {
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
                    <div key={stat.name} className="stat-card">
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
                {/* Recent Activity */}
                <div className="card lg:col-span-2">
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                        <p className="text-sm text-gray-500">Today's attendance records</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="table-header">Cadet</th>
                                    <th className="table-header">Event</th>
                                    <th className="table-header">Status</th>
                                    <th className="table-header">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentActivity.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="py-6 text-center text-sm text-gray-500">
                                            No attendance records for today.
                                        </td>
                                    </tr>
                                ) : (
                                    recentActivity.map((record) => (
                                        <tr key={record.id} className="hover:bg-gray-50">
                                            <td className="table-cell font-medium text-gray-900">{record.cadet}</td>
                                            <td className="table-cell">{record.event}</td>
                                            <td className="table-cell">
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
                                            <td className="table-cell text-gray-500">{record.time}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Upcoming Events */}
                <div className="card">
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
                        <p className="text-sm text-gray-500">Next scheduled activities</p>
                    </div>
                    <div className="space-y-4 p-6">
                        {upcomingEvents.length === 0 ? (
                            <p className="text-center text-sm text-gray-500">No upcoming events scheduled.</p>
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
            </div>
        </AuthenticatedLayout>
    );
}