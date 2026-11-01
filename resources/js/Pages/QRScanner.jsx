import { useEffect, useState, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { QrCodeIcon, CameraIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';

export default function QRScanner() {
    const { auth } = usePage().props;
    const user = auth?.user;

    const [events, setEvents] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [studentIdNumber, setStudentIdNumber] = useState('');
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [recentScans, setRecentScans] = useState([]);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState('');

    const html5QrcodeRef = useRef(null);
    const isProcessingScan = useRef(false);

    // Fetch Events & Sessions
useEffect(() => {
    axios
        .get('/api/events')
        .then(({ data }) => {
            const rawSessions = Array.isArray(data) ? data : data?.data ?? [];

            const formattedSessions = rawSessions.map((session) => {
                const sessionTypeName = session.session_type === 'morning' ? 'Morning' : 'Afternoon';
                const formationName = session.formation?.formation_name ?? 'Formation';
                const formationDate = session.formation?.formation_date 
                    ? new Date(session.formation.formation_date).toLocaleDateString()
                    : '';

                return {
                    session_id: session.session_id,
                    label: `${sessionTypeName} Session — ${formationName} (${formationDate})`
                };
            });

            setSessions(formattedSessions);

            if (formattedSessions.length > 0) {
                setSelectedSessionId(String(formattedSessions[0].session_id));
            }
        })
        .catch((error) => {
            console.error("Failed to fetch sessions:", error);
            setSessions([]);
        });
}, []);

    // Load Attendance History
    useEffect(() => {
        axios
            .get('/api/attendance')
            .then(({ data }) => {
                const records = Array.isArray(data) ? data : data?.data ?? [];
                setRecentScans(records);
            })
            .catch(() => setRecentScans([]));
    }, []);

    // Automatic Backend Submission
    const processScanSubmission = async (scannedPayload) => {
    if (!scannedPayload || isProcessingScan.current || !selectedSessionId) return;

    // Regex to extract USeP Student ID format (e.g., 2026-00382) from prefixed strings like "4B9B0BF6-2026-00382"
    const studentIdMatch = scannedPayload.match(/\d{4}-\d{5}/) || scannedPayload.match(/\d{4}-\d{4,6}/);
    
    // Fallback: strip leading hash/uuid prefixes if hyphenated
    const cleanedStudentId = studentIdMatch 
        ? studentIdMatch[0] 
        : scannedPayload.split('-').slice(-2).join('-').trim();

    console.log("Scanned Raw:", scannedPayload);
    console.log("Extracted Student ID:", cleanedStudentId);

    setStudentIdNumber(cleanedStudentId);

    isProcessingScan.current = true;
    setScanning(true);
    setScanResult(null);

    try {
        const { data } = await axios.post('/api/attendance/scan', {
            student_id_number: cleanedStudentId,
            session_id: Number(selectedSessionId),
            scanned_by: user?.id ?? user?.email ?? 'System Officer',
        });

        setScanResult(data);

        // Refresh recent scans table
        const { data: scans } = await axios.get('/api/attendance');
        setRecentScans(Array.isArray(scans) ? scans : scans?.data ?? []);
    } catch (error) {
        setScanResult({
            status: 'invalid',
            message: error?.response?.data?.message ?? `Scan failed. Cadet ID "${cleanedStudentId}" not found.`,
        });
    } finally {
        setScanning(false);
        setTimeout(() => {
            isProcessingScan.current = false;
        }, 2000);
    }
};

    // Camera Start & Stop Handlers
    const startCamera = async () => {
        setCameraError('');

        try {
            // Trigger native browser permission prompt explicitly
            await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });

            if (!html5QrcodeRef.current) {
                html5QrcodeRef.current = new Html5Qrcode("qr-reader-viewport");
            }

            await html5QrcodeRef.current.start(
                { facingMode: "environment" }, // Prefer rear camera on mobile
                {
                    fps: 15,
                    qrbox: { width: 220, height: 220 },
                    aspectRatio: 1.0,
                },
                (decodedText) => {
                    // Automatic detection trigger
                    processScanSubmission(decodedText);
                },
                () => {
                    // Ignore frame-by-frame read attempts
                }
            );

            setIsCameraActive(true);
        } catch (err) {
            console.error("Camera access failed:", err);
            setCameraError('Camera access denied or unavailable. Please grant permissions and ensure HTTPS.');
            setIsCameraActive(false);
        }
    };

    const stopCamera = async () => {
        if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
            await html5QrcodeRef.current.stop();
            setIsCameraActive(false);
        }
    };

    useEffect(() => {
        return () => {
            if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
                html5QrcodeRef.current.stop().catch((e) => console.error(e));
            }
        };
    }, []);

    return (
        <AuthenticatedLayout header="QR Scanner">
            <Head title="QR Scanner" />

            <div className="mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">QR Code Scanner</h2>
                <p className="text-xs sm:text-sm text-gray-500">Scan cadet USeP QR codes to log attendance</p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Mobile-Optimized Scanner Viewport */}
                <div className="card p-4 sm:p-6 bg-white shadow rounded-lg">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Live Camera Feed</h3>
                        <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                isCameraActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                            <span className={`h-2 w-2 rounded-full ${isCameraActive ? 'animate-pulse bg-green-500' : 'bg-gray-400'}`} />
                            {isCameraActive ? 'Scanning Live' : 'Off'}
                        </span>
                    </div>

                    {/* Camera Feed Viewport */}
                    <div className="relative mx-auto mb-4 w-full max-w-[320px] aspect-square overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-900 flex items-center justify-center">
                        <div id="qr-reader-viewport" className="w-full h-full object-cover"></div>

                        {!isCameraActive && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gray-50">
                                <QrCodeIcon className="h-16 w-16 text-gray-300" />
                                <p className="mt-2 text-xs sm:text-sm text-gray-500">Camera preview off</p>
                                <button
                                    type="button"
                                    onClick={startCamera}
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-medium text-white shadow hover:bg-indigo-700 active:scale-95 transition"
                                >
                                    <CameraIcon className="h-4 w-4" /> Start Mobile Camera
                                </button>
                            </div>
                        )}
                    </div>

                    {cameraError && (
                        <p className="mb-4 text-xs text-red-600 text-center bg-red-50 p-2.5 rounded-lg border border-red-200">
                            {cameraError}
                        </p>
                    )}

                    {/* Session Selector */}
                    <div className="mb-4">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                            Session
                        </label>
                        <select
                            className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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

                    {/* Scanned Student ID Display / Manual Input */}
                    <div className="mb-4">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                            Detected Student ID
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono"
                                placeholder="Auto-filled on QR scan or enter ID..."
                                value={studentIdNumber}
                                onChange={(e) => setStudentIdNumber(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && processScanSubmission(studentIdNumber)}
                            />
                            <button
                                type="button"
                                onClick={() => processScanSubmission(studentIdNumber)}
                                disabled={scanning || !studentIdNumber.trim()}
                                className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                Submit
                            </button>
                        </div>
                    </div>

                    {/* Toggle Controls */}
                    {isCameraActive && (
                        <button
                            type="button"
                            onClick={stopCamera}
                            className="w-full py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition"
                        >
                            Pause Camera
                        </button>
                    )}

                    {/* Scan Status Alert */}
                    {scanResult && (
                        <div
                            className={`mt-4 rounded-xl border p-3.5 shadow-sm ${
                                scanResult.status === 'present' || scanResult.status === 'late'
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-red-50 border-red-200'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                {scanResult.status === 'present' || scanResult.status === 'late' ? (
                                    <CheckCircleIcon className="h-5 w-5 text-green-600 shrink-0" />
                                ) : (
                                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600 shrink-0" />
                                )}
                                <p className="text-xs sm:text-sm font-semibold text-gray-900">
                                    {scanResult.status ? scanResult.status.toUpperCase() : 'INVALID'}
                                </p>
                            </div>
                            {scanResult.message && <p className="mt-1 text-xs text-gray-600">{scanResult.message}</p>}
                        </div>
                    )}
                </div>

                {/* Mobile-Friendly Roster View */}
                <div className="card bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                    <div className="border-b border-gray-100 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center">
                        <div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Scans</h3>
                            <p className="text-xs text-gray-500">Live attendance feed</p>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-[380px] overflow-y-auto">
                        {recentScans.length === 0 ? (
                            <div className="p-6 text-center text-xs sm:text-sm text-gray-500">
                                No attendance records logged yet today.
                            </div>
                        ) : (
                            recentScans.map((scan) => (
                                <div key={scan.record_id || scan.id} className="flex items-center gap-3 px-4 py-3 sm:px-6">
                                    <div
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
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
                                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                            {scan.user?.first_name} {scan.user?.last_name}
                                        </p>
                                        <p className="text-[11px] sm:text-xs text-gray-500 font-mono">
                                            {scan.user?.serial_number ?? scan.user?.email ?? ''}
                                        </p>
                                    </div>
                                    <span className="text-[11px] sm:text-xs text-gray-500 font-mono shrink-0">
                                        {scan.time_in ?? ''}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}