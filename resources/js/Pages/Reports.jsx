import { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { 
    ArrowDownTrayIcon, 
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
    sessions = [],
    cadetAttendanceList = []
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRiskOnly, setFilterRiskOnly] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);

    const filteredCadets = useMemo(() => {
        return cadetAttendanceList.filter((cadet) => {
            const nameStr = cadet.name || `${cadet.first_name || ''} ${cadet.last_name || ''}`;
            const idStr = cadet.student_id || cadet.student_id_number || '';
            const programStr = cadet.program || cadet.course || '';
            const absences = cadet.absences || 0;

            const matchesSearch = 
                nameStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
                idStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
                programStr.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesRisk = filterRiskOnly ? absences >= 3 : true;

            return matchesSearch && matchesRisk;
        });
    }, [cadetAttendanceList, searchQuery, filterRiskOnly]);

    // Download formatted Excel export matching the exact ATTENDANCE layout
    const handleExport = () => {
        window.location.href = route('reports.export-excel');
    };

    // Color code helper matching exact Excel colors
    const getCellColorClass = (val) => {
        if (val == 10) return 'bg-[#92D050] text-gray-900 font-bold border border-gray-300'; // Green
        if (val == 5) return 'bg-[#FFFF00] text-gray-900 font-bold border border-gray-300';  // Yellow
        if (val == 8) return 'bg-[#BDD7EE] text-gray-900 font-bold border border-gray-300';  // Light Blue
        if (val === 'A' || val == 0) return 'bg-[#FF0000] text-white font-bold border border-gray-300'; // Red
        return 'bg-gray-50 text-gray-400 border border-gray-300';
    };

    const criticalAbsences = useMemo(() => {
        if (metrics.criticalAbsencesCount !== undefined) return metrics.criticalAbsencesCount;
        return cadetAttendanceList.filter(c => (c.absences || 0) >= 3).length;
    }, [metrics.criticalAbsencesCount, cadetAttendanceList]);

    const totalPages = Math.ceil(filteredCadets.length / pageSize) || 1;
    const paginatedCadets = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredCadets.slice(start, start + pageSize);
    }, [filteredCadets, currentPage, pageSize]);

    // Format dates for table header
    const formatDateHeader = (session, index) => {
        if (session?.session_date) {
            const d = new Date(session.session_date);
            return `${d.getDate().toString().padStart(2, '0')}-${d.toLocaleString('en-US', { month: 'short' })}`;
        }
        if (session?.title) return session.title;
        return `S-${index + 1}`;
    };

    const activeSessions = sessions.length > 0 
        ? sessions 
        : Array.from({ length: 19 }, (_, i) => ({ 
            id: i + 1, 
            session_number: i < 15 ? i + 1 : `F${i - 14}` 
          }));

    return (
        <AuthenticatedLayout header="Attendance Reports">
            <Head title="Attendance Sheet" />

            {/* Top Bar */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">USeP TAGUM UNIT — ATTENDANCE SHEET</h2>
                    <p className="text-sm text-gray-500">Official Color-Coded Attendance Log (LE 1: 30%)</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleExport} 
                        className="btn-primary flex items-center gap-2 bg-[#7B1E1E] px-4 py-2 text-xs font-semibold text-white rounded-md hover:bg-[#5C1515] transition"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        Export Official Attendance Excel
                    </button>
                </div>
            </div>

            {/* Metrics Summary Cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

            {/* Exact Excel ATTENDANCE Table Replica */}
            <div className="card bg-white shadow rounded-lg border border-gray-300 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">USeP TAGUM UNIT</h3>
                            <p className="text-xs font-semibold text-gray-500">MALE &amp; FEMALE ROSTER</p>
                        </div>
                        {/* Legend */}
                        <div className="flex items-center gap-3 text-xs border-l pl-4 border-gray-300">
                            <span className="flex items-center gap-1 font-medium">
                                <span className="w-3.5 h-3.5 bg-[#92D050] inline-block rounded-sm border border-gray-400"></span> 10 Present
                            </span>
                            <span className="flex items-center gap-1 font-medium">
                                <span className="w-3.5 h-3.5 bg-[#FFFF00] inline-block rounded-sm border border-gray-400"></span> 5 Late
                            </span>
                            <span className="flex items-center gap-1 font-medium">
                                <span className="w-3.5 h-3.5 bg-[#FF0000] inline-block rounded-sm border border-gray-400"></span> A Absent
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
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

                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search cadet name or ID..."
                                className="pl-9 pr-3 py-1.5 text-xs rounded-md border-gray-300 shadow-sm focus:border-[#7B1E1E] focus:ring-[#7B1E1E] w-56"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead>
                            {/* Header Row 1: Banner */}
                            <tr className="bg-[#84CAEB] text-gray-900 border-b border-gray-400 text-center font-bold">
                                <th colSpan="2" className="p-2 border-r border-gray-400 text-center font-bold text-sm">USeP TAGUM UNIT</th>
                                <th colSpan={activeSessions.length} className="p-2 border-r border-gray-400 text-center font-bold text-sm">LE 1: ATTENDANCE (30%)</th>
                                <th className="p-2 bg-[#E7E773] text-gray-900 border-l border-gray-400 font-bold">TOTAL</th>
                            </tr>
                            {/* Header Row 2: Session Numbers */}
                            <tr className="bg-[#E7E773] text-gray-900 border-b border-gray-400 text-center font-bold">
                                <td colSpan="2" className="p-1.5 border-r border-gray-400 text-center font-bold">MALE &amp; FEMALE</td>
                                {activeSessions.map((session, idx) => (
                                    <td key={`snum-${session.id || idx}`} className="p-1 border-r border-gray-400 w-9">
                                        {idx < 15 ? idx + 1 : `F${idx - 14}`}
                                    </td>
                                ))}
                                <td className="p-1 font-bold"></td>
                            </tr>
                            {/* Header Row 3: Labels and Dates */}
                            <tr className="bg-[#FFFFCC] text-gray-900 border-b-2 border-gray-400 font-bold">
                                <th className="p-2 border-r border-gray-400 w-10 text-center">Nr.</th>
                                <th className="p-2 border-r border-gray-400 min-w-[220px]">SURNAME, Given Name, MI</th>
                                {activeSessions.map((session, idx) => (
                                    <th key={`sdate-${session.id || idx}`} className="p-1.5 border-r border-gray-400 text-center font-mono text-[11px] w-9">
                                        {formatDateHeader(session, idx)}
                                    </th>
                                ))}
                                <th className="p-2 text-center w-14 font-bold">190</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-300 font-sans">
                            {paginatedCadets.length === 0 ? (
                                <tr>
                                    <td colSpan={activeSessions.length + 3} className="py-8 text-center text-sm text-gray-500">
                                        No cadet attendance records found matching the filter.
                                    </td>
                                </tr>
                            ) : (
                                paginatedCadets.map((cadet, idx) => {
                                    return (
                                        <tr key={cadet.id || cadet.user_id} className="hover:bg-gray-50 transition">
                                            <td className="p-2 border-r border-gray-300 text-center font-mono font-bold text-gray-700">
                                                {(currentPage - 1) * pageSize + idx + 1}
                                            </td>
                                            <td className="p-2 border-r border-gray-300 font-semibold text-gray-900">
                                                {cadet.name || `${cadet.last_name}, ${cadet.first_name}`}
                                            </td>
                                            {activeSessions.map((session, sIdx) => {
                                                const sId = session.id ?? session.session_id ?? (sIdx + 1);
                                                const val = cadet.matrix?.[sId] ?? 'A';
                                                return (
                                                    <td 
                                                        key={`cell-${cadet.id}-${sId}`} 
                                                        className={`p-1.5 text-center font-mono text-xs ${getCellColorClass(val)}`}
                                                    >
                                                        {val}
                                                    </td>
                                                );
                                            })}
                                            <td className="p-2 text-center font-mono font-bold text-gray-900 bg-[#FCE4D6] border-l border-gray-300">
                                                {cadet.attendance_points ?? 0}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
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
                            <option value={15}>15</option>
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
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-100 transition"
                        >
                            <ChevronLeftIcon className="h-4 w-4" />
                        </button>
                        <span className="font-semibold">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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