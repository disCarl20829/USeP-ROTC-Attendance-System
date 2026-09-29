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

const stats = [
    { name: 'Total Cadets', value: '258', icon: UsersIcon, change: '+12%', changeType: 'positive' },
    { name: 'Active Events', value: '6', icon: CalendarDaysIcon, change: '+2', changeType: 'positive' },
    { name: 'Attendance Rate', value: '94.2%', icon: ClipboardDocumentCheckIcon, change: '+3.1%', changeType: 'positive' },
    { name: 'Absent Today', value: '15', icon: ExclamationTriangleIcon, change: '-5', changeType: 'negative' },
];

const recentActivity = [
    { id: 1, cadet: 'Juan Dela Cruz', event: 'Morning Formation', status: 'present', time: '06:00 AM' },
    { id: 2, cadet: 'Maria Santos', event: 'Morning Formation', status: 'present', time: '06:01 AM' },
    { id: 3, cadet: 'Pedro Reyes', event: 'Morning Formation', status: 'late', time: '06:15 AM' },
    { id: 4, cadet: 'Ana Garcia', event: 'Morning Formation', status: 'absent', time: '-' },
    { id: 5, cadet: 'Carlos Mendoza', event: 'Morning Formation', status: 'present', time: '05:58 AM' },
    { id: 6, cadet: 'Sofia Ramirez', event: 'Morning Formation', status: 'present', time: '06:02 AM' },
];

const upcomingEvents = [
    { id: 1, name: 'Battalion Drill', date: 'Oct 15, 2026', time: '06:00 AM', location: 'Parade Ground' },
    { id: 2, name: 'Leadership Seminar', date: 'Oct 18, 2026', time: '01:00 PM', location: 'ROTC Office' },
    { id: 3, name: 'Physical Training', date: 'Oct 20, 2026', time: '05:30 AM', location: 'Track Oval' },
];

export default function Dashboard() {
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
                            {stat.changeType === 'positive' ? (
                                <ArrowTrendingUpIcon className="mr-1 h-4 w-4 text-green-500" />
                            ) : (
                                <ArrowTrendingUpIcon className="mr-1 h-4 w-4 rotate-180 text-red-500" />
                            )}
                            <span className={stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}>
                                {stat.change}
                            </span>
                            <span className="ml-1 text-gray-500">from last week</span>
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
                                {recentActivity.map((record) => (
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
                                ))}
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
                        {upcomingEvents.map((event) => (
                            <div key={event.id} className="flex gap-4 rounded-lg border border-gray-100 p-4 transition-colors hover:border-[#7B1E1E]/20 hover:bg-[#7B1E1E]/5">
                                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-[#7B1E1E] text-white">
                                    <span className="text-xs font-medium">{event.date.split(' ')[0]}</span>
                                    <span className="text-lg font-bold leading-none">{event.date.split(' ')[1].replace(',', '')}</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-gray-900">{event.name}</p>
                                    <p className="text-sm text-gray-500">{event.time} - {event.location}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
