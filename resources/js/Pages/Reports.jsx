import { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { 
    ArrowDownTrayIcon, 
    UsersIcon, 
    AcademicCapIcon,
    ExclamationTriangleIcon,
    MagnifyingGlassIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';

export default function Reports({
    metrics = { totalEvents: 0, activeCadets: 0, totalEnrolled: 0, criticalAbsencesCount: 0 },
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

    const handleExport = () => {
        window.location.href = route('reports.export-excel');
    };

    const getCellColorClass = (val) => {
        if (val == 10) return 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 shadow-2xs';
        if (val == 5) return 'bg-amber-100 text-amber-800 font-bold border border-amber-200 shadow-2xs';
        if (val == 8) return 'bg-sky-100 text-sky-800 font-bold border border-sky-200 shadow-2xs';
        if (val === 'A' || val == 0) return 'bg-rose-100 text-rose-800 font-bold border border-rose-200 shadow-2xs';
        return 'bg-gray-50 text-gray-300 border border-gray-200';
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

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Modern Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-md bg-[#7B1E1E]/10 text-[#7B1E1E] text-xs font-bold uppercase tracking-wider">
                                USeP Tagum Unit
                            </span>
                            <span className="text-xs text-gray-400 font-semibold">• Official Roster</span>
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight mt-1">LE 1: Attendance Matrix (30%)</h2>
                        <p className="text-xs text-gray-500 font-medium">Synchronized color-coded attendance log matching institutional standards.</p>
                    </div>
                    <div>
                        <button 
                            onClick={handleExport} 
                            className="flex items-center gap-2 bg-[#7B1E1E] px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md hover:bg-[#5C1515] active:scale-95 transition-all"
                        >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                            Export Excel Workbook
                        </button>
                    </div>
                </div>

                {/* Professional Metric Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="p-5 bg-white shadow-xs rounded-2xl border border-gray-100 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <AcademicCapIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Enrolled</p>
                            <p className="text-2xl font-black text-gray-900">{metrics.totalEnrolled || cadetAttendanceList.length}</p>
                        </div>
                    </div>

                    <div className="p-5 bg-white shadow-xs rounded-2xl border border-gray-100 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                            <UsersIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Active Cadets</p>
                            <p className="text-2xl font-black text-gray-900">{metrics.activeCadets}</p>
                        </div>
                    </div>

                    <div className="p-5 bg-rose-50/50 shadow-xs rounded-2xl border border-rose-100 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                            <ExclamationTriangleIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-rose-700 font-bold uppercase tracking-wider">3+ Absences (Risk)</p>
                            <p className="text-2xl font-black text-rose-700">{criticalAbsences}</p>
                        </div>
                    </div>
                </div>

                {/* Main Table Card */}
                <div className="bg-white shadow-xs rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gray-50/30">
                        <div className="flex flex-wrap items-center gap-6">
                            <div>
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Roster Grid</h3>
                                <p className="text-xs text-gray-500 font-medium">Male &amp; Female Cadet Records</p>
                            </div>
                            
                            {/* Modern Status Legend */}
                            <div className="flex items-center gap-4 text-xs sm:border-l sm:pl-5 border-gray-200">
                                <span className="flex items-center gap-1.5 font-semibold text-gray-700">
                                    <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-2xs"></span> 10 (Present)
                                </span>
                                <span className="flex items-center gap-1.5 font-semibold text-gray-700">
                                    <span className="w-3 h-3 rounded-full bg-amber-400 shadow-2xs"></span> 5 (Late)
                                </span>
                                <span className="flex items-center gap-1.5 font-semibold text-gray-700">
                                    <span className="w-3 h-3 rounded-full bg-rose-500 shadow-2xs"></span> A (Absent)
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={() => {
                                    setFilterRiskOnly(!filterRiskOnly);
                                    setCurrentPage(1);
                                }}
                                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                                    filterRiskOnly 
                                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm' 
                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                {filterRiskOnly ? 'Showing 3+ Absences Only' : 'Filter 3+ Absences'}
                            </button>

                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search name or ID..."
                                    className="pl-10 pr-4 py-2 text-xs rounded-xl border-gray-200 bg-white shadow-2xs focus:border-[#7B1E1E] focus:ring-[#7B1E1E] w-60 font-medium placeholder-gray-400"
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
                                <tr className="bg-slate-900 text-white text-center font-bold">
                                    <th colSpan="2" className="py-3 px-3 border-r border-slate-700 text-left font-black text-xs tracking-wider uppercase pl-4">USeP Tagum Unit</th>
                                    <th colSpan={activeSessions.length} className="py-3 px-3 border-r border-slate-700 text-center font-black text-xs tracking-wider uppercase">LE 1: Attendance (30%)</th>
                                    <th className="py-3 px-3 bg-slate-800 text-white font-black text-xs tracking-wider uppercase">Total</th>
                                </tr>
                                <tr className="bg-slate-800 text-slate-200 border-b border-slate-700 text-center font-bold text-[11px]">
                                    <td colSpan="2" className="py-2 px-3 border-r border-slate-700 text-left font-bold pl-4">MALE &amp; FEMALE</td>
                                    {activeSessions.map((session, idx) => (
                                        <td key={`snum-${session.id || idx}`} className="py-2 px-1 border-r border-slate-700 w-9 font-mono">
                                            {idx < 15 ? idx + 1 : `F${idx - 14}`}
                                        </td>
                                    ))}
                                    <td className="py-2 px-2 font-mono">190</td>
                                </tr>
                                <tr className="bg-gray-100 text-gray-700 border-b-2 border-gray-300 font-bold">
                                    <th className="py-2.5 px-3 border-r border-gray-200 w-12 text-center">Nr.</th>
                                    <th className="py-2.5 px-4 border-r border-gray-200 min-w-[220px]">SURNAME, Given Name, MI</th>
                                    {activeSessions.map((session, idx) => (
                                        <th key={`sdate-${session.id || idx}`} className="py-2.5 px-1 border-r border-gray-200 text-center font-mono text-[10px] text-gray-500 w-9">
                                            {formatDateHeader(session, idx)}
                                        </th>
                                    ))}
                                    <th className="py-2.5 px-3 text-center w-14 font-black bg-gray-200 text-gray-900">Pts</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-sans">
                                {paginatedCadets.length === 0 ? (
                                    <tr>
                                        <td colSpan={activeSessions.length + 3} className="py-12 text-center text-sm font-medium text-gray-400">
                                            No cadet attendance records found matching your query.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedCadets.map((cadet, idx) => {
                                        return (
                                            <tr key={cadet.id || cadet.user_id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-3 px-3 border-r border-gray-100 text-center font-mono font-bold text-gray-500">
                                                    {(currentPage - 1) * pageSize + idx + 1}
                                                </td>
                                                <td className="py-3 px-4 border-r border-gray-100 font-bold text-gray-900">
                                                    {cadet.name || `${cadet.last_name}, ${cadet.first_name}`}
                                                    <span className="block text-[10px] font-mono text-gray-400 font-normal">
                                                        {cadet.student_id} • {cadet.program}
                                                    </span>
                                                </td>
                                                {activeSessions.map((session, sIdx) => {
                                                    const sId = session.id ?? session.session_id ?? (sIdx + 1);
                                                    const val = cadet.matrix?.[sId] ?? 'A';
                                                    return (
                                                        <td 
                                                            key={`cell-${cadet.id}-${sId}`} 
                                                            className={`py-2 px-1 text-center font-mono text-xs ${getCellColorClass(val)}`}
                                                        >
                                                            {val}
                                                        </td>
                                                    );
                                                })}
                                                <td className="py-3 px-3 text-center font-mono font-black text-gray-900 bg-gray-50 border-l border-gray-200">
                                                    {cadet.attendance_points ?? 0}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Bar */}
                    <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600 bg-white">
                        <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-400">Rows per page:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="text-xs py-1.5 px-3 rounded-xl border-gray-200 bg-gray-50 font-bold shadow-2xs focus:ring-[#7B1E1E]"
                            >
                                <option value={15}>l5</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <span className="font-medium text-gray-500">
                                Showing {filteredCadets.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
                                {Math.min(currentPage * pageSize, filteredCadets.length)} of {filteredCadets.length} entries
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-xl border border-gray-200 bg-white disabled:opacity-30 hover:bg-gray-50 transition-all shadow-2xs"
                            >
                                <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
                            </button>
                            <span className="font-bold text-gray-700">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-xl border border-gray-200 bg-white disabled:opacity-30 hover:bg-gray-50 transition-all shadow-2xs"
                            >
                                <ChevronRightIcon className="h-4 w-4 text-gray-600" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}