import { useEffect, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { QrCodeIcon, CameraIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

export default function QRScanner() {
    const { auth } = usePage().props;
    const user = auth?.user;

    const [events, setEvents] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [qrToken, setQrToken] = useState('');
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [recentScans, setRecentScans] = useState([]);

    useEffect(() => {
        axios
            .get('/api/events')
            .then(({ data }) => {
                const evts = Array.isArray(data) ? data : data?.data ?? [];
                setEvents(evts);

                const firstSession = evts
                    .flatMap((event) => event.sessions ?? [])
                    .map((session) => ({ ...session, label: `${session.session_type === 'morning' ? 'Morning' : 'Afternoon'} Session — ${event.formation_name} (${event.formation_date})` }))
                    .sort((a, b) => a.session_id - b.session_id);

                if (firstSession.length > 0) {
                    setSessions(firstSession);
                    setSelectedSessionId(String(firstSession[0].session_id));
                }
            })
            .catch(() => setEvents([]));
    }, []);

    useEffect(() => {
        axios
            .get('/api/attendance')
            .then(({ data }) => {
                const records = Array.isArray(data) ? data : data?.data ?? [];
                setRecentScans(records);
            })
            .catch(() => setRecentScans([]));
    }, []);

    const handleScan = async () => {
        if (!qrToken.trim() || !selectedSessionId) return;

        setScanning(true);
        setScanResult(null);

        try {
            const { data } = await axios.post('/api/attendance/scan', {
                qr_token: qrToken.trim(),
                session_id: Number(selectedSessionId),
                scanned_by: user?.id ?? user?.email,
            });

            setScanResult(data);

            const { data: scans } = await axios.get('/api/attendance');
            setRecentScans(Array.isArray(scans) ? scans : scans?.data ?? []);
        } catch (error) {
            setScanResult({
                status: 'invalid',
                message: error?.response?.data?.message ?? 'Scan failed. Please try again.',
            });
        } finally {
            setScanning(false);
        }
    };

    const statusStyles = {
        present: 'bg-green-100 text-green-700',
        late: 'bg-yellow-100 text-yellow-700',
        absent: 'bg-red-100 text-red-700',
    };

    return (
        <AuthenticatedLayout header="QR Scanner">
            <Head title="QR Scanner" />

            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">QR Code Scanner</h2>
                <p className="text-sm text-gray-500">Scan cadet QR codes to record attendance</p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Scanner */}
                <div className="card p-6">
                    <div className="mb-6 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Scanner</h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                            Active
                        </span>
                    </div>

                    {/* Scanner viewport */}
                    <div className="relative mx-auto mb-6 flex h-64 w-64 items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50">
                        <div className="text-center">
                            <QrCodeIcon className="mx-auto h-16 w-16 text-gray-300" />
                            <p className="mt-2 text-sm text-gray-500">Position QR code here</p>
                        </div>
                        {/* Corner markers */}
                        <div className="absolute left-4 top-4 h-8 w-8 border-l-4 border-t-4 border-[#7B1E1E] rounded-tl-lg" />
                        <div className="absolute right-4 top-4 h-8 w-8 border-r-4 border-t-4 border-[#7B1E1E] rounded-tr-lg" />
                        <div className="absolute bottom-4 left-4 h-8 w-8 border-b-4 border-l-4 border-[#7B1E1E] rounded-bl-lg" />
                        <div className="absolute bottom-4 right-4 h-8 w-8 border-b-4 border-r-4 border-[#7B1E1E] rounded-br-lg" />
                    </div>

                    {/* Session selector */}
                    <div className="mb-4">
                        <label className="label-text">Select Session</label>
                        <select
                            className="input-field"
                            value={selectedSessionId}
                            onChange={(e) => setSelectedSessionId(e.target.value)}
                        >
                            {sessions.map((session) => (
                                <option key={session.session_id} value={session.session_id}>
                                    {session.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* QR token input */}
                    <div className="mb-4">
                        <label className="label-text">QR Token</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Scan or enter QR token"
                            value={qrToken}
                            onChange={(e) => setQrToken(e.target.value)}
                        />
                    </div>

                    <button
                        className="btn-primary w-full justify-center"
                        onClick={handleScan}
                        disabled={scanning || !qrToken.trim() || !selectedSessionId}
                    >
                        <CameraIcon className="mr-2 h-4 w-4" />
                        {scanning ? 'Scanning...' : 'Start Scanning'}
                    </button>

                    {/* Scan result */}
                    {scanResult && (
                        <div className="mt-6 rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center gap-2">
                                {scanResult.status === 'present' ? (
                                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                                ) : (
                                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                                )}
                                <p className="text-sm font-medium text-gray-900">
                                    Status: {scanResult.status ? scanResult.status.charAt(0).toUpperCase() + scanResult.status.slice(1) : 'Unknown'}
                                </p>
                            </div>
                            {scanResult.message && <p className="mt-1 text-sm text-gray-500">{scanResult.message}</p>}
                        </div>
                    )}
                </div>

                {/* Recent scans */}
                <div className="card">
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Scans</h3>
                        <p className="text-sm text-gray-500">Latest attendance records from QR scans</p>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {recentScans.map((scan) => (
                            <div key={scan.record_id} className="flex items-center gap-4 px-6 py-4">
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                        scan.status === 'present'
                                            ? 'bg-green-100'
                                            : scan.status === 'late'
                                            ? 'bg-yellow-100'
                                            : 'bg-red-100'
                                    }`}
                                >
                                    {scan.status === 'present' && <CheckCircleIcon className="h-5 w-5 text-green-600" />}
                                    {scan.status === 'late' && <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />}
                                    {scan.status === 'absent' && <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-gray-900">{scan.user?.first_name} {scan.user?.last_name}</p>
                                    <p className="text-sm text-gray-500">
                                        {scan.user?.id_number ?? scan.user?.email ?? ''} {scan.session ? `${scan.session.session_type} — ${scan.session.formation_id}` : ''}
                                    </p>
                                </div>
                                <span className="text-sm text-gray-500">{scan.time_in ?? ''}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
