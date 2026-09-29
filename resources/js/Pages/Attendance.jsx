import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { CheckCircleIcon, XCircleIcon, ClockIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

const attendanceRecords = [
    { id: 1, cadet: 'Juan Dela Cruz', idNumber: '2021-0001', event: 'Morning Formation', date: 'Oct 15, 2026', time: '06:00 AM', status: 'present' },
    { id: 2, cadet: 'Maria Santos', idNumber: '2021-0002', event: 'Morning Formation', date: 'Oct 15, 2026', time: '06:01 AM', status: 'present' },
    { id: 3, cadet: 'Pedro Reyes', idNumber: '2021-0003', event: 'Morning Formation', date: 'Oct 15, 2026', time: '06:15 AM', status: 'late' },
    { id: 4, cadet: 'Ana Garcia', idNumber: '2021-0004', event: 'Morning Formation', date: 'Oct 15, 2026', time: '-', status: 'absent' },
    { id: 5, cadet: 'Carlos Mendoza', idNumber: '2021-0005', event: 'Morning Formation', date: 'Oct 15, 2026', time: '05:58 AM', status: 'present' },
    { id: 6, cadet: 'Sofia Ramirez', idNumber: '2021-0006', event: 'Morning Formation', date: 'Oct 15, 2026', time: '06:02 AM', status: 'present' },
    { id: 7, cadet: 'Miguel Torres', idNumber: '2021-0007', event: 'Morning Formation', date: 'Oct 15, 2026', time: '06:00 AM', status: 'present' },
    { id: 8, cadet: 'Isabella Cruz', idNumber: '2021-0008', event: 'Morning Formation', date: 'Oct 15, 2026', time: '06:05 AM', status: 'late' },
];

export default function Attendance() {
    return (
        <AuthenticatedLayout header="Attendance">
            <Head title="Attendance" />

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Attendance Records</h2>
                    <p className="text-sm text-gray-500">View and manage attendance for all events</p>
                </div>
                <div className="flex gap-3">
                    <select className="input-field w-auto">
                        <option>All Events</option>
                        <option>Morning Formation</option>
                        <option>Battalion Drill</option>
                        <option>Physical Training</option>
                    </select>
                    <input type="date" className="input-field w-auto" defaultValue="2026-10-15" />
                </div>
            </div>

            {/* Summary stats */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="card flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                        <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">245</p>
                        <p className="text-sm text-gray-500">Present</p>
                    </div>
                </div>
                <div className="card flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                        <ClockIcon className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">8</p>
                        <p className="text-sm text-gray-500">Late</p>
                    </div>
                </div>
                <div className="card flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                        <XCircleIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">5</p>
                        <p className="text-sm text-gray-500">Absent</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="table-header">Cadet</th>
                                <th className="table-header">ID Number</th>
                                <th className="table-header">Event</th>
                                <th className="table-header">Date</th>
                                <th className="table-header">Time</th>
                                <th className="table-header">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {attendanceRecords.map((record) => (
                                <tr key={record.id} className="hover:bg-gray-50">
                                    <td className="table-cell">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7B1E1E]/10 text-sm font-bold text-[#7B1E1E]">
                                                {record.cadet.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <span className="font-medium text-gray-900">{record.cadet}</span>
                                        </div>
                                    </td>
                                    <td className="table-cell text-gray-500">{record.idNumber}</td>
                                    <td className="table-cell">{record.event}</td>
                                    <td className="table-cell text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                                            {record.date}
                                        </div>
                                    </td>
                                    <td className="table-cell text-gray-500">{record.time}</td>
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="border-t border-gray-100 px-6 py-4">
                    <p className="text-sm text-gray-500">Showing {attendanceRecords.length} records</p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
