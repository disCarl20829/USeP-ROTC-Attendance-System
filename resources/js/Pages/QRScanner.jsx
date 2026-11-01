import { useEffect, useState, useRef, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { 
    QrCodeIcon, 
    CameraIcon, 
    CheckCircleIcon, 
    ExclamationTriangleIcon, 
    ArrowLeftOnRectangleIcon, 
    ArrowRightOnRectangleIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';

export default function QRScanner() {
    const { auth } = usePage().props;
    const user = auth?.user;

    const [sessions, setSessions] = useState([]);
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [scanType, setScanType] = useState('In');
    const [studentIdNumber, setStudentIdNumber] = useState('');
    const [scanning, setScanning] = useState(false);
    const [recentScans, setRecentScans] = useState([]);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState('');

    const [modalConfig, setModalConfig] = useState({ isOpen: false, status: 'success', title: '', message: '' });

    const html5QrcodeRef = useRef(null);
    
    const isProcessingScan = useRef(false);
    const lastScannedId = useRef(null);
    const lastScanTime = useRef(0);
    const SCAN_COOLDOWN = 3000;

    const scanTypeRef = useRef(scanType);
    useEffect(() => {
        scanTypeRef.current = scanType;
    }, [scanType]);

    const selectedSessionIdRef = useRef(selectedSessionId);
    useEffect(() => {
        selectedSessionIdRef.current = selectedSessionId;
    }, [selectedSessionId]);

    useEffect(() => {
        axios
            .get('/api/events')
            .then(({ data }) => {
                const rawSessions = Array.isArray(data) ? data : data?.data ?? [];
                const todayStr = new Date().toDateString();

                const todaySessions = rawSessions.filter((session) => {
                    const sessionDateRaw = session.formation?.formation_date || session.event_date || session.date;
                    const sessionDateStr = sessionDateRaw ? new Date(sessionDateRaw).toDateString() : todayStr;

                    return sessionDateStr === todayStr && session.status !== 'completed' && session.is_completed !== true;
                });

                const scannablePool = todaySessions.length > 0 ? todaySessions : rawSessions.filter(s => s.status !== 'completed');

                const formattedSessions = scannablePool.map((session) => {
                    const sessionTypeName = session.session_type === 'morning' ? 'Morning' : 'Afternoon';
                    const formationName = session.formation?.formation_name ?? session.title ?? session.name ?? 'Formation';
                    const resolvedId = session.session_id ?? session.id ?? session.event_id;

                    return {
                        session_id: resolvedId,
                        label: `${sessionTypeName} Session — ${formationName}`
                    };
                });

                setSessions(formattedSessions);

                if (formattedSessions.length > 0) {
                    const defaultId = String(formattedSessions[0].session_id);
                    setSelectedSessionId(defaultId);
                    selectedSessionIdRef.current = defaultId;
                }
            })
            .catch((error) => {
                console.error("Failed to fetch sessions:", error);
                setSessions([]);
            });
    }, []);

    const fetchAttendance = useCallback(async () => {
        try {
            const { data } = await axios.get('/api/attendance');
            const records = Array.isArray(data) ? data : data?.data ?? [];
            setRecentScans(records);
        } catch (err) {
            setRecentScans([]);
        }
    }, []);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    const closeModal = () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
    };

    const processScanSubmission = async (scannedPayload) => {
        const now = Date.now();
        const currentScanType = scanTypeRef.current;
        const currentActiveSessionId = selectedSessionIdRef.current;

        if (!scannedPayload || isProcessingScan.current) return;

        if (!currentActiveSessionId || String(currentActiveSessionId).trim() === '') {
            setModalConfig({
                isOpen: true,
                status: 'error',
                title: 'No Session Selected',
                message: 'Please select an active session scheduled for today before scanning.'
            });
            return;
        }

        const studentIdMatch = scannedPayload.match(/\d{4}-\d{5}/) || scannedPayload.match(/\d{4}-\d{4,6}/);
        const cleanedStudentId = studentIdMatch ? studentIdMatch[0] : scannedPayload.trim();

        if (cleanedStudentId === lastScannedId.current && (now - lastScanTime.current) < SCAN_COOLDOWN) {
            return;
        }

        lastScannedId.current = cleanedStudentId;
        lastScanTime.current = now;
        isProcessingScan.current = true;

        setStudentIdNumber(cleanedStudentId);
        setScanning(true);

        try {
            const { data } = await axios.post('/api/attendance/scan', {
                student_id_number: cleanedStudentId,
                student_id: cleanedStudentId,
                session_id: Number(currentActiveSessionId),
                scan_type: currentScanType,
                type: currentScanType.toLowerCase(),
                scanned_by: user?.id ?? user?.email ?? 'System Officer',
            });

            setModalConfig({
                isOpen: true,
                status: 'success',
                title: `${currentScanType.toUpperCase()} Recorded!`,
                message: data.message ?? `Attendance successfully logged for Cadet ${cleanedStudentId}`
            });

            setStudentIdNumber('');
            await fetchAttendance();
        } catch (error) {
            setModalConfig({
                isOpen: true,
                status: 'error',
                title: 'Scan Rejected',
                message: error?.response?.data?.message ?? `Database processing failed for Cadet ID "${cleanedStudentId}".`
            });
        } finally {
            setScanning(false);
            setTimeout(() => {
                isProcessingScan.current = false;
            }, 1200);
        }
    };

    const startCamera = async () => {
        setCameraError('');

        try {
            await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });

            if (html5QrcodeRef.current) {
                try {
                    if (html5QrcodeRef.current.isScanning) {
                        await html5QrcodeRef.current.stop();
                    }
                    html5QrcodeRef.current.clear();
                } catch (e) {
                    console.warn("Scanner reset:", e);
                }
            }

            html5QrcodeRef.current = new Html5Qrcode("qr-reader-viewport");

            const config = {
                fps: 15,
                qrbox: (viewfinderWidth, viewfinderHeight) => {
                    const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                    return {
                        width: Math.floor(minEdge * 0.8),
                        height: Math.floor(minEdge * 0.8),
                    };
                },
                experimentalFeatures: { useBarCodeDetectorIfSupported: true }
            };

            await html5QrcodeRef.current.start(
                { facingMode: "environment" },
                config,
                (decodedText) => processScanSubmission(decodedText),
                () => {}
            );

            setIsCameraActive(true);
        } catch (err) {
            console.error("Camera access error:", err);
            setCameraError('Camera access denied or unavailable.');
            setIsCameraActive(false);
        }
    };

    const stopCamera = async () => {
        if (html5QrcodeRef.current) {
            try {
                if (html5QrcodeRef.current.isScanning) {
                    await html5QrcodeRef.current.stop();
                }
                html5QrcodeRef.current.clear();
            } catch (err) {
                console.error("Camera stop error:", err);
            }
        }
        setIsCameraActive(false);
    };

    useEffect(() => {
        return () => {
            if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
                html5QrcodeRef.current.stop().catch((e) => console.error("Unmount cleanup:", e));
            }
        };
    }, []);

    const displayedScans = recentScans.filter((scan) => {
        if (!selectedSessionId) return true;
        return Number(scan.session_id) === Number(selectedSessionId);
    });

    return (
        <AuthenticatedLayout header="QR Scanner">
            <Head title="QR Scanner" />

            <div className="mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Cadet Attendance Scanner</h2>
                <p className="text-xs sm:text-sm text-gray-500">Scan cadet QR codes to record real-time IN / OUT attendance</p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="card p-4 sm:p-6 bg-white shadow rounded-lg border border-gray-200">
                    <div className="mb-4 grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setScanType('In')}
                            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
                                scanType === 'In'
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            <ArrowRightOnRectangleIcon className="h-5 w-5" />
                            Scan IN
                        </button>

                        <button
                            type="button"
                            onClick={() => setScanType('Out')}
                            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
                                scanType === 'Out'
                                    ? 'bg-rose-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                            Scan OUT
                        </button>
                    </div>

                    <div className="relative mx-auto mb-4 w-full max-w-[320px] aspect-square overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-900 flex items-center justify-center">
                        <div 
                            id="qr-reader-viewport" 
                            className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover [&>canvas]:hidden"
                        ></div>

                        {isCameraActive && (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <div className="relative h-[220px] w-[220px] rounded-lg border-2 border-indigo-400/50">
                                    <div className="absolute -left-1 -top-1 h-5 w-5 border-l-4 border-t-4 border-indigo-500" />
                                    <div className="absolute -right-1 -top-1 h-5 w-5 border-r-4 border-t-4 border-indigo-500" />
                                    <div className="absolute -bottom-1 -left-1 h-5 w-5 border-b-4 border-l-4 border-indigo-500" />
                                    <div className="absolute -bottom-1 -right-1 h-5 w-5 border-b-4 border-r-4 border-indigo-500" />
                                </div>
                            </div>
                        )}

                        {!isCameraActive && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gray-50 z-10">
                                <QrCodeIcon className="h-16 w-16 text-gray-300" />
                                <p className="mt-2 text-xs sm:text-sm text-gray-500">Camera preview off</p>
                                <button
                                    type="button"
                                    onClick={startCamera}
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-medium text-white shadow hover:bg-indigo-700 active:scale-95 transition"
                                >
                                    <CameraIcon className="h-4 w-4" /> Start Camera
                                </button>
                            </div>
                        )}
                    </div>

                    {cameraError && (
                        <p className="mb-4 text-xs text-red-600 text-center bg-red-50 p-2.5 rounded-lg border border-red-200">
                            {cameraError}
                        </p>
                    )}

                    <div className="mb-4">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                            Today's Active Session
                        </label>
                        {sessions.length === 0 ? (
                            <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                                No formation sessions scheduled for today.
                            </p>
                        ) : (
                            <select
                                className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={selectedSessionId}
                                onChange={(e) => {
                                    setSelectedSessionId(e.target.value);
                                    selectedSessionIdRef.current = e.target.value;
                                }}
                            >
                                {sessions.map((session) => (
                                    <option key={session.session_id} value={session.session_id}>
                                        {session.label}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                            Cadet ID Number
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm"
                                placeholder="Auto-filled on scan or enter ID..."
                                value={studentIdNumber}
                                onChange={(e) => setStudentIdNumber(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && processScanSubmission(studentIdNumber)}
                            />
                            <button
                                type="button"
                                onClick={() => processScanSubmission(studentIdNumber)}
                                disabled={scanning || !studentIdNumber.trim() || !selectedSessionId}
                                className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                Submit
                            </button>
                        </div>
                    </div>

                    {isCameraActive && (
                        <button
                            type="button"
                            onClick={stopCamera}
                            className="w-full py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition"
                        >
                            Pause Camera
                        </button>
                    )}
                </div>

                {/* Database Roster Log */}
<div className="card bg-white shadow rounded-lg overflow-hidden border border-gray-200">
    <div className="border-b border-gray-100 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center">
        <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Database Attendance Roster</h3>
            <p className="text-xs text-gray-500">Live database records for selected session</p>
        </div>
    </div>
    <div className="divide-y divide-gray-100 max-h-[380px] overflow-y-auto">
        {displayedScans.length === 0 ? (
            <div className="p-6 text-center text-xs sm:text-sm text-gray-500">
                No database records logged for this session yet.
            </div>
        ) : (
            displayedScans.map((scan) => (
                <div key={scan.record_id || scan.id} className="flex items-center gap-3 px-4 py-3 sm:px-6">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                        <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                            {scan.user?.first_name ? `${scan.user.first_name} ${scan.user.last_name}` : (scan.student_name ?? scan.cadet ?? 'Cadet')}
                        </p>
                        <p className="text-[11px] sm:text-xs text-gray-500 font-mono">
                            ID: {scan.user?.serial_number ?? scan.student_id_number ?? scan.idNumber ?? scan.student_id ?? ''}
                        </p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-[11px] sm:text-xs text-emerald-700 font-mono font-medium">
                            IN: {scan.time_in ?? scan.entry_date ?? scan.in_time ?? '--:--'}
                        </p>
                        <p className="text-[11px] sm:text-xs text-rose-600 font-mono font-medium">
                            OUT: {scan.time_out ?? scan.exit_date ?? scan.out_time ?? '--:--'}
                        </p>
                    </div>
                </div>
            ))
        )}
    </div>
</div>
            </div>

            {modalConfig.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-gray-100 text-center relative">
                        <button 
                            onClick={closeModal}
                            className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>

                        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
                            modalConfig.status === 'success' ? 'bg-emerald-100' : 'bg-rose-100'
                        }`}>
                            {modalConfig.status === 'success' ? (
                                <CheckCircleIcon className="h-8 w-8 text-emerald-600" />
                            ) : (
                                <ExclamationTriangleIcon className="h-8 w-8 text-rose-600" />
                            )}
                        </div>

                        <h3 className="text-lg font-bold text-gray-900">{modalConfig.title}</h3>
                        <p className="mt-2 text-xs sm:text-sm text-gray-600">{modalConfig.message}</p>

                        <button
                            type="button"
                            onClick={closeModal}
                            className={`mt-6 w-full rounded-xl py-2.5 text-xs font-semibold text-white shadow transition ${
                                modalConfig.status === 'success'
                                    ? 'bg-emerald-600 hover:bg-emerald-700'
                                    : 'bg-rose-600 hover:bg-rose-700'
                            }`}
                        >
                            Continue Scanning
                        </button>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}