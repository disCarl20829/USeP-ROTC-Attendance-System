import { useState, useMemo, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { 
    CheckCircleIcon, 
    XCircleIcon, 
    ClockIcon, 
    ExclamationTriangleIcon, 
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function Attendance({ sessions = [], cadets = [], records = [] }) {
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Ensure first available session is automatically selected on prop load
    useEffect(() => {
        if (sessions.length > 0) {
            if (!selectedSessionId || !sessions.some((s) => String(s.session_id) === String(selectedSessionId))) {
                setSelectedSessionId(String(sessions[0].session_id));
            }
        }
    }, [sessions, selectedSessionId]);

    // Active session details
    const currentSession = useMemo(() => {
        return sessions.find((s) => String(s.session_id) === String(selectedSessionId)) || null;
    }, [sessions, selectedSessionId]);

    // Calculate total cumulative absences per cadet across ALL sessions
    const cadetAbsenceCounts = useMemo(() => {
        const counts = {};
        
        cadets.forEach((cadet) => {
            let totalAbsences = 0;

            sessions.forEach((session) => {
                const scan = records.find(
                    (r) => r.user_id === cadet.user_id && String(r.session_id) === String(session.session_id)
                );

                if (!scan || scan.status === 'absent') {
                    totalAbsences += 1;
                }
            });

            counts[cadet.user_id] = totalAbsences;
        });

        return counts;
    }, [cadets, sessions, records]);

    // Total count of cadets with 3 or more absences
    const atRiskCadetsCount = useMemo(() => {
        return Object.values(cadetAbsenceCounts).filter((count) => count >= 3).length;
    }, [cadetAbsenceCounts]);

    // Build session roster
    const sessionRoster = useMemo(() => {
        if (!selectedSessionId) return [];

        const roster = cadets.map((cadet) => {
            const scan = records.find(
                (r) => r.user_id === cadet.user_id && String(r.session_id) === String(selectedSessionId)
            );

            const totalAbsences = cadetAbsenceCounts[cadet.user_id] || 0;

            return {
                id: cadet.user_id,
                cadet: cadet.name,
                idNumber: cadet.id_number,
                event: currentSession ? currentSession.label : 'Formation',
                date: currentSession ? currentSession.date : 'N/A',
                timeIn: scan ? scan.time_in : '--:--',
                timeOut: scan ? scan.time_out : '--:--',
                status: scan ? scan.status : 'absent',
                totalAbsences: totalAbsences,
                isAtRisk: totalAbsences >= 3,
            };
        });

        return roster.sort((a, b) => a.cadet.localeCompare(b.cadet));
    }, [cadets, records, selectedSessionId, currentSession, cadetAbsenceCounts]);

    // Filter roster by search & status
    const filteredRoster = useMemo(() => {
        return sessionRoster.filter((item) => {
            const query = searchQuery.toLowerCase().trim();
            const matchesSearch = 
                !query || 
                item.cadet.toLowerCase().includes(query) || 
                item.idNumber.toLowerCase().includes(query);

            let matchesStatus = true;
            if (statusFilter === 'present') matchesStatus = item.status === 'present';
            if (statusFilter === 'late') matchesStatus = item.status === 'late';
            if (statusFilter === 'absent') matchesStatus = item.status === 'absent';
            if (statusFilter === 'at_risk') matchesStatus = item.isAtRisk;

            return matchesSearch && matchesStatus;
        });
    }, [sessionRoster, searchQuery, statusFilter]);

    // Compute session-level statistics
    const stats = useMemo(() => {
        const total = sessionRoster.length;
        const present = sessionRoster.filter((r) => r.status === 'present').length;
        const late = sessionRoster.filter((r) => r.status === 'late').length;
        const absent = sessionRoster.filter((r) => r.status === 'absent').length;

        return { total, present, late, absent };
    }, [sessionRoster]);

    return (
        <AuthenticatedLayout header="Attendance">
            <Head title="Attendance" />

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Session Attendance Roster</h2>
                    <p className="text-sm text-gray-500">View cadet attendance status and track absence warnings</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Search Input */}
                    <div className="relative">
                        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            className="w-full sm:w-56 rounded-lg border-gray-300 pl-9 pr-3 text-xs shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="Search cadet or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        className="w-full sm:w-auto rounded-lg border-gray-300 text-xs font-medium shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="present">Present Only</option>
                        <option value="late">Late Only</option>
                        <option value="absent">Absent Only</option>
                        <option value="at_risk">⚠️ 3+ Absences (At Risk)</option>
                    </select>

                    {/* Session Selector */}
                    <select
                        className="w-full sm:w-auto rounded-lg border-gray-300 text-xs font-semibold shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-800"
                        value={selectedSessionId}
                        onChange={(e) => setSelectedSessionId(e.target.value)}
                    >
                        {sessions.length === 0 ? (
                            <option value="">No Sessions Available</option>
                        ) : (
                            sessions.map((s) => (
                                <option key={s.session_id} value={s.session_id}>
                                    {s.label}
                                </option>
                            ))
                        )}
                    </select>
                </div>
            </div>

            {/* Metric Summary Cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="card flex items-center gap-4 p-4 bg-white shadow rounded-lg border border-gray-100">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                        <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">
                            {stats.present} <span className="text-sm font-normal text-gray-500">/ {stats.total}</span>
                        </p>
                        <p className="text-xs font-medium text-gray-500">Present (This Session)</p>
                    </div>
                </div>

                <div className="card flex items-center gap-4 p-4 bg-white shadow rounded-lg border border-gray-100">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
                        <ClockIcon className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{stats.late}</p>
                        <p className="text-xs font-medium text-gray-500">Late (This Session)</p>
                    </div>
                </div>

                <div className="card flex items-center gap-4 p-4 bg-white shadow rounded-lg border border-gray-100">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-100">
                        <XCircleIcon className="h-6 w-6 text-rose-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{stats.absent}</p>
                        <p className="text-xs font-medium text-gray-500">Absent (This Session)</p>
                    </div>
                </div>

                <div className="card flex items-center gap-4 p-4 bg-white shadow rounded-lg border border-red-200 bg-red-50/20">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-red-600">{atRiskCadetsCount}</p>
                        <p className="text-xs font-medium text-red-700">Cadets At Risk (3+ Absences)</p>
                    </div>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="card bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="p-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Cadet Name (A–Z)
                                </th>
                                <th className="p-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    ID Number
                                </th>
                                <th className="p-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Total Absences
                                </th>
                                <th className="p-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Time In
                                </th>
                                <th className="p-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Time Out
                                </th>
                                <th className="p-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Session Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredRoster.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-sm text-gray-500">
                                        No cadets found matching the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredRoster.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition">
                                        <td className="p-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                                                    {item.cadet.split(' ').map((n) => n[0]).join('')}
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                                                    <span className="font-semibold text-sm text-gray-900">{item.cadet}</span>
                                                    {item.isAtRisk && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">
                                                            <ExclamationTriangleIcon className="h-3 w-3 text-red-600" />
                                                            3+ Absences (At Risk)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3.5 text-xs text-gray-500 font-mono">{item.idNumber}</td>
                                        <td className="p-3.5 text-center">
                                            <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-mono font-bold ${
                                                item.totalAbsences >= 3 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {item.totalAbsences}
                                            </span>
                                        </td>
                                        <td className="p-3.5 text-xs text-emerald-700 font-mono font-medium">{item.timeIn}</td>
                                        <td className="p-3.5 text-xs text-rose-600 font-mono font-medium">{item.timeOut}</td>
                                        <td className="p-3.5">
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                    item.status === 'present'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : item.status === 'late'
                                                        ? 'bg-amber-100 text-amber-800'
                                                        : 'bg-rose-100 text-rose-800'
                                                }`}
                                            >
                                                {item.status === 'present' && <CheckCircleIcon className="h-3.5 w-3.5" />}
                                                {item.status === 'absent' && <XCircleIcon className="h-3.5 w-3.5" />}
                                                {item.status === 'late' && <ClockIcon className="h-3.5 w-3.5" />}
                                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 flex justify-between items-center text-xs text-gray-500">
                    <p>Showing {filteredRoster.length} of {sessionRoster.length} cadets</p>
                    <p className="font-semibold text-gray-700">{currentSession ? currentSession.label : ''}</p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}