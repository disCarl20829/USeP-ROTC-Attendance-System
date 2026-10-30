import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { ArrowDownTrayIcon, CalendarDaysIcon, ChartBarIcon, UsersIcon } from '@heroicons/react/24/outline';

export default function Reports({
    metrics = { averageAttendance: 0, totalEvents: 0, activeCadets: 0 },
    monthlyData = [],
    topCadets = []
}) {
    const handleExport = () => {
        window.print();
    };

    return (
        <AuthenticatedLayout header="Reports">
            <Head title="Reports" />

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
                    <p className="text-sm text-gray-500">View attendance statistics and generate reports</p>
                </div>
                <div className="flex gap-3">
                    <select className="input-field w-auto rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm">
                        <option>This Semester</option>
                        <option>Last Semester</option>
                        <option>This Year</option>
                    </select>
                    <button onClick={handleExport} className="btn-primary flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium text-sm">
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Summary cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="card p-6 bg-white shadow rounded-lg border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#7B1E1E]/10">
                            <ChartBarIcon className="h-6 w-6 text-[#7B1E1E]" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Average Attendance</p>
                            <p className="text-2xl font-bold text-gray-900">{metrics.averageAttendance}%</p>
                        </div>
                    </div>
                </div>
                <div className="card p-6 bg-white shadow rounded-lg border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#7B1E1E]/10">
                            <CalendarDaysIcon className="h-6 w-6 text-[#7B1E1E]" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Events</p>
                            <p className="text-2xl font-bold text-gray-900">{metrics.totalEvents}</p>
                        </div>
                    </div>
                </div>
                <div className="card p-6 bg-white shadow rounded-lg border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#7B1E1E]/10">
                            <UsersIcon className="h-6 w-6 text-[#7B1E1E]" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Active Cadets</p>
                            <p className="text-2xl font-bold text-gray-900">{metrics.activeCadets}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Chart */}
                <div className="card p-6 bg-white shadow rounded-lg border border-gray-100">
                    <h3 className="mb-6 text-lg font-semibold text-gray-900">Monthly Attendance Trend</h3>
                    <div className="flex h-64 items-end justify-between gap-2 border-b border-gray-200 pb-2">
                        {monthlyData.length === 0 ? (
                            <div className="w-full flex justify-center items-center h-full text-sm text-gray-400">
                                No monthly data logged yet.
                            </div>
                        ) : (
                            monthlyData.map((item, idx) => (
                                <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                                    <div className="relative w-full max-w-[40px] flex items-end h-48 bg-gray-50 rounded-t-lg">
                                        <div
                                            className="w-full rounded-t-lg bg-[#7B1E1E] transition-all duration-500"
                                            style={{ height: `${item.attendance}%` }}
                                        />
                                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[11px] font-medium text-gray-600">
                                            {item.attendance}%
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-500 font-mono">{item.month}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Top cadets */}
                <div className="card bg-white shadow rounded-lg border border-gray-100 overflow-hidden">
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h3 className="text-lg font-semibold text-gray-900">Top Attendance</h3>
                        <p className="text-sm text-gray-500">Cadets with highest attendance rate</p>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {topCadets.length === 0 ? (
                            <div className="p-6 text-center text-sm text-gray-500">
                                No cadet attendance rankings available.
                            </div>
                        ) : (
                            topCadets.map((cadet, index) => (
                                <div key={cadet.id} className="flex items-center gap-4 px-6 py-4">
                                    <div
                                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                                            index === 0
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : index === 1
                                                ? 'bg-gray-100 text-gray-700'
                                                : index === 2
                                                ? 'bg-orange-100 text-orange-700'
                                                : 'bg-gray-50 text-gray-500'
                                        }`}
                                    >
                                        {index + 1}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-gray-900 truncate">{cadet.name}</p>
                                        <p className="text-xs text-gray-500">{cadet.events} events attended</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-[#7B1E1E]">{cadet.attendance}%</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}