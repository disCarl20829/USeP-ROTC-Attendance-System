import { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { 
    ArrowDownTrayIcon, 
    CalendarDaysIcon, 
    ChartBarIcon, 
    UsersIcon, 
    AcademicCapIcon,
    ExclamationTriangleIcon,
    MagnifyingGlassIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';

export default function Reports({
    metrics = { averageAttendance: 0, totalEvents: 0, activeCadets: 0, totalEnrolled: 0, criticalAbsencesCount: 0 },
    monthlyData = [],
    cadetAttendanceList = []
}) {
    // Pagination & Search States
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRiskOnly, setFilterRiskOnly] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const handleExport = () => {
        window.print();
    };

    // Filter cadets efficiently with useMemo
    const filteredCadets = useMemo(() => {
        return cadetAttendanceList.filter((cadet) => {
            const nameStr = cadet.name || `${cadet.first_name || ''} ${cadet.last_name || ''}`;
            const idStr = cadet.student_id || cadet.idNumber || cadet.student_id_number || '';
            const absences = cadet.absences || 0;

            const matchesSearch = 
                nameStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
                idStr.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesRisk = filterRiskOnly ? absences >= 3 : true;

            return matchesSearch && matchesRisk;
        });
    }, [cadetAttendanceList, searchQuery, filterRiskOnly]);

    // Derived metric for 3+ absences if not directly passed in metrics prop
    const criticalAbsences = useMemo(() => {
        if (metrics.criticalAbsencesCount !== undefined) return metrics.criticalAbsencesCount;
        return cadetAttendanceList.filter(c => (c.absences || 0) >= 3).length;
    }, [metrics.criticalAbsencesCount, cadetAttendanceList]);

    // Lazy load / Slice rendering for pagination (renders only 10-50 DOM nodes at a time)
    const totalPages = Math.ceil(filteredCadets.length / pageSize) || 1;
    const paginatedCadets = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredCadets.slice(start, start + pageSize);
    }, [filteredCadets, currentPage, pageSize]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <AuthenticatedLayout header="Reports">
            <Head title="Reports & Analytics" />

            {/* Top Bar */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
                    <p className="text-sm text-gray-500">View attendance statistics, warnings, and comprehensive cadet records</p>
                </div>
                <div className="flex gap-3">
                    <select className="input-field w-auto rounded-md border-gray-300 text-xs shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        <option>This Semester</option>
                        <option>Last Semester</option>
                        <option>This Academic Year</option>
                    </select>
                    <button 
                        onClick={handleExport} 
                        className="btn-primary flex items-center gap-2 bg-indigo-600 px-4 py-2 text-xs font-medium text-white rounded-md hover:bg-indigo-700 transition"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Metrics Summary Cards (4 Columns) */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Enrolled */}
                <div className="card p-5 bg-white shadow rounded-lg border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <AcademicCapIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-medium">Total Enrolled</p>
                            <p className="text-2xl font-bold text-gray-900">{metrics.totalEnrolled || cadetAttendanceList.length}</p>
                        </div>
                    </div>
                </div>

                {/* Active Cadets */}
                <div className="card p-5 bg-white shadow rounded-lg border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                            <UsersIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-medium">Active Cadets</p>
                            <p className="text-2xl font-bold text-gray-900">{metrics.activeCadets}</p>
                        </div>
                    </div>
                </div>

                {/* Average Attendance */}
                <div className="card p-5 bg-white shadow rounded-lg border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#7B1E1E]/10 text-[#7B1E1E]">
                            <ChartBarIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-medium">Average Attendance</p>
                            <p className="text-2xl font-bold text-gray-900">{metrics.averageAttendance}%</p>
                        </div>
                    </div>
                </div>

                {/* 3+ Absences Alert */}
                <div className="card p-5 bg-white shadow rounded-lg border border-rose-100 bg-rose-50/30">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                            <ExclamationTriangleIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-rose-600 font-semibold uppercase">3+ Absences (Risk)</p>
                            <p className="text-2xl font-bold text-rose-700">{criticalAbsences}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Monthly Attendance Chart */}
            <div className="mb-6 card p-6 bg-white shadow rounded-lg border border-gray-100">
                <h3 className="mb-6 text-lg font-semibold text-gray-900">Monthly Attendance Trend</h3>
                <div className="flex h-56 items-end justify-between gap-2 border-b border-gray-200 pb-2">
                    {monthlyData.length === 0 ? (
                        <div className="w-full flex justify-center items-center h-full text-sm text-gray-400">
                            No monthly attendance data logged yet.
                        </div>
                    ) : (
                        monthlyData.map((item, idx) => (
                            <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                                <div className="relative w-full max-w-[40px] flex items-end h-40 bg-gray-50 rounded-t-lg">
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

            {/* Cadet Absences & Lates Detailed Table */}
            <div className="card bg-white shadow rounded-lg border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Cadet Attendance Log</h3>
                        <p className="text-xs text-gray-500">Full summary of total lates and absences per cadet</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Filter 3+ Absences toggle */}
                        <button
                            onClick={() => {
                                setFilterRiskOnly(!filterRiskOnly);
                                setCurrentPage(1);
                            }}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition ${
                                filterRiskOnly 
                                    ? 'bg-rose-600 text-white border-rose-600' 
                                    : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                            }`}
                        >
                            {filterRiskOnly ? 'Showing 3+ Absences Only' : 'Filter 3+ Absences'}
                        </button>

                        {/* Search Input */}
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search cadet name or ID..."
                                className="pl-9 pr-3 py-1.5 text-xs rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 w-56"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-600 uppercase font-semibold border-b border-gray-200">
                            <tr>
                                <th className="p-3.5">Cadet Name</th>
                                <th className="p-3.5">Student ID</th>
                                <th className="p-3.5">Course / Platoon</th>
                                <th className="p-3.5 text-center">Total Lates</th>
                                <th className="p-3.5 text-center">Total Absences</th>
                                <th className="p-3.5 text-center">Status Warning</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedCadets.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-sm text-gray-500">
                                        No cadets found matching the query.
                                    </td>
                                </tr>
                            ) : (
                                paginatedCadets.map((cadet) => {
                                    const lates = cadet.lates || 0;
                                    const absences = cadet.absences || 0;
                                    const isCritical = absences >= 3;

                                    return (
                                        <tr key={cadet.id || cadet.user_id} className="hover:bg-gray-50 transition">
                                            <td className="p-3.5 font-semibold text-gray-900">
                                                {cadet.name || `${cadet.last_name}, ${cadet.first_name}`}
                                            </td>
                                            <td className="p-3.5 text-gray-600 font-mono">
                                                {cadet.student_id || cadet.idNumber || 'N/A'}
                                            </td>
                                            <td className="p-3.5 text-gray-600">
                                                {cadet.course || cadet.platoon || 'N/A'}
                                            </td>
                                            <td className="p-3.5 text-center font-semibold text-amber-600">
                                                {lates}
                                            </td>
                                            <td className="p-3.5 text-center font-semibold text-rose-600">
                                                {absences}
                                            </td>
                                            <td className="p-3.5 text-center">
                                                {isCritical ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                                                        <ExclamationTriangleIcon className="h-3 w-3" />
                                                        3+ ABSENCES (DROPPED RISK)
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                                                        GOOD STANDING
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Lazy-Loading Pagination Controls */}
                <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                        <span>Rows per page:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="input-field text-xs py-1 px-2 rounded border-gray-300"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span>
                            Showing {filteredCadets.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
                            {Math.min(currentPage * pageSize, filteredCadets.length)} of {filteredCadets.length} entries
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-100 transition"
                        >
                            <ChevronLeftIcon className="h-4 w-4" />
                        </button>
                        <span className="font-semibold">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-100 transition"
                        >
                            <ChevronRightIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}