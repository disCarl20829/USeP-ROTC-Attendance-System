import { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { CheckCircleIcon, XCircleIcon, ClockIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

export default function Attendance({ records = [], stats = { present: 0, late: 0, absent: 0 }, events = [] }) {
    const [selectedEvent, setSelectedEvent] = useState('All Events');
    const [selectedDate, setSelectedDate] = useState('');

    // Filter records dynamically based on dropdown controls
    const filteredRecords = useMemo(() => {
        return records.filter((record) => {
            const matchesEvent = selectedEvent === 'All Events' || record.event.includes(selectedEvent);
            const matchesDate = !selectedDate || record.rawDate === selectedDate;
            return matchesEvent && matchesDate;
        });
    }, [records, selectedEvent, selectedDate]);

    return (
        <AuthenticatedLayout header="Attendance">
            <Head title="Attendance" />

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Attendance Records</h2>
                    <p className="text-sm text-gray-500">View and manage attendance for all events</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <select
                        className="input-field w-auto rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                        value={selectedEvent}
                        onChange={(e) => setSelectedEvent(e.target.value)}
                    >
                        <option value="All Events">All Events</option>
                        {events.map((evt, idx) => (
                            <option key={idx} value={evt}>
                                {evt}
                            </option>
                        ))}
                    </select>

                    <input
                        type="date"
                        className="input-field w-auto rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                </div>
            </div>

            {/* Summary Stats Dynamic Readouts */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="card flex items-center gap-4 p-4 bg-white shadow rounded-lg border border-gray-100">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                        <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{stats.present}</p>
                        <p className="text-sm text-gray-500">Present</p>
                    </div>
                </div>

                <div className="card flex items-center gap-4 p-4 bg-white shadow rounded-lg border border-gray-100">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                        <ClockIcon className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{stats.late}</p>
                        <p className="text-sm text-gray-500">Late</p>
                    </div>
                </div>

                <div className="card flex items-center gap-4 p-4 bg-white shadow rounded-lg border border-gray-100">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                        <XCircleIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{stats.absent}</p>
                        <p className="text-sm text-gray-500">Absent</p>
                    </div>
                </div>
            </div>

            {/* Attendance Records Table */}
            <div className="card bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="table-header text-left p-3.5 text-xs font-semibold text-gray-600 uppercase">Cadet</th>
                                <th className="table-header text-left p-3.5 text-xs font-semibold text-gray-600 uppercase">ID Number</th>
                                <th className="table-header text-left p-3.5 text-xs font-semibold text-gray-600 uppercase">Event</th>
                                <th className="table-header text-left p-3.5 text-xs font-semibold text-gray-600 uppercase">Date</th>
                                <th className="table-header text-left p-3.5 text-xs font-semibold text-gray-600 uppercase">Time</th>
                                <th className="table-header text-left p-3.5 text-xs font-semibold text-gray-600 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-sm text-gray-500">
                                        No attendance records found matching the filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50 transition">
                                        <td className="table-cell p-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7B1E1E]/10 text-xs font-bold text-[#7B1E1E]">
                                                    {record.cadet.split(' ').map((n) => n[0]).join('')}
                                                </div>
                                                <span className="font-medium text-sm text-gray-900">{record.cadet}</span>
                                            </div>
                                        </td>
                                        <td className="table-cell p-3.5 text-sm text-gray-500 font-mono">{record.idNumber}</td>
                                        <td className="table-cell p-3.5 text-sm text-gray-700">{record.event}</td>
                                        <td className="table-cell p-3.5 text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                                                {record.date}
                                            </div>
                                        </td>
                                        <td className="table-cell p-3.5 text-sm text-gray-500 font-mono">{record.time}</td>
                                        <td className="table-cell p-3.5">
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                    record.status === 'present'
                                                        ? 'bg-green-100 text-green-700'
                                                        : record.status === 'late'
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}
                                            >
                                                {record.status === 'present' && <CheckCircleIcon className="h-3.5 w-3.5" />}
                                                {record.status === 'absent' && <XCircleIcon className="h-3.5 w-3.5" />}
                                                {record.status === 'late' && <ClockIcon className="h-3.5 w-3.5" />}
                                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
                    <p className="text-xs text-gray-500">Showing {filteredRecords.length} records</p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}