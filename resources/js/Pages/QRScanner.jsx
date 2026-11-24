import { useEffect, useState, useRef, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
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

const STATUS_OPTIONS = [
    { value: 'present', label: 'Present', className: 'bg-emerald-600 hover:bg-emerald-700' },
    { value: 'late', label: 'Late', className: 'bg-amber-500 hover:bg-amber-600' },
    { value: 'excused', label: 'Excused', className: 'bg-sky-600 hover:bg-sky-700' },
    { value: 'absent', label: 'Absent', className: 'bg-rose-600 hover:bg-rose-700' },
];

export default function QRScanner({ points = {} }) {
    const [sessions, setSessions] = useState([]);
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [scanType, setScanType] = useState('In');
    const [studentIdNumber, setStudentIdNumber] = useState('');
    const [scanning, setScanning] = useState(false);
    const [recentScans, setRecentScans] = useState([]);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState('');

    // status: success | error | duplicate. `record` is set for duplicates.
    const [modalConfig, setModalConfig] = useState({ isOpen: false, status: 'success', title: '', message: '', record: null });
    const [changingStatus, setChangingStatus] = useState(false);

    const html5QrcodeRef = useRef(null);

    // While a result is on screen, the camera ignores new codes.
    const isProcessingScan = useRef(false);
    const lastScannedCode = useRef(null);
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
                const formatted = (Array.isArray(data) ? data : []).map((s) => ({
                    session_id: s.session_id,
                    is_today: s.is_today,
                    label:
                        `${s.session_type === 'morning' ? 'Morning' : 'Afternoon'} — ${s.formation_name ?? 'Formation'}` +
                        (s.is_today ? ' (today)' : s.formation_date ? ` (${s.formation_date})` : ''),
                }));
                setSessions(formatted);
                if (formatted.length > 0) {
                    const defaultId = String(formatted[0].session_id);
                    setSelectedSessionId(defaultId);
                    selectedSessionIdRef.current = defaultId;
                }
            })
            .catch(() => setSessions([]));
    }, []);

    const fetchAttendance = useCallback(async () => {
        try {
            const { data } = await axios.get('/api/attendance/recent', {
                params: selectedSessionIdRef.current ? { session_id: selectedSessionIdRef.current } : {},
            });
            setRecentScans(Array.isArray(data) ? data : []);
        } catch {
            setRecentScans([]);
        }
    }, []);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance, selectedSessionId]);

    const closeModal = () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false, record: null }));
        setTimeout(() => {
            isProcessingScan.current = false;
        }, 500);
    };

    const showResult = (status, title, message, record = null) => {
        isProcessingScan.current = true;
        setModalConfig({ isOpen: true, status, title, message, record });
    };

    const processScanSubmission = async (scannedPayload) => {
        const now = Date.now();
        const code = String(scannedPayload ?? '').trim();
        const sessionId = selectedSessionIdRef.current;

        if (!code || isProcessingScan.current) return;

        if (!sessionId) {
            showResult('error', 'No session selected', 'Select a formation session before scanning.');
            return;
        }

        // The camera reads the same code many times per second.
        if (code === lastScannedCode.current && now - lastScanTime.current < SCAN_COOLDOWN) return;

        lastScannedCode.current = code;
        lastScanTime.current = now;
        isProcessingScan.current = true;
        setScanning(true);

        try {
            const { data } = await axios.post('/api/attendance/scan', {
                code,
                session_id: Number(sessionId),
                scan_type: scanTypeRef.current.toLowerCase(),
            });
            showResult('success', `${scanTypeRef.current.toUpperCase()} recorded`, data.message, data.record);
            setStudentIdNumber('');
            fetchAttendance();
        } catch (error) {
            const res = error?.response;
            if (res?.status === 409 && res.data?.record) {
                showResult('duplicate', 'Already recorded', `${res.data.message} Change the status?`, res.data.record);
            } else if (res?.data?.code === 'dropped') {
                showResult('error', 'Dropped cadet', res.data.message);
            } else {
                showResult('error', 'Scan rejected', res?.data?.message ?? 'Could not record this scan. Try again.');
            }
        } finally {
            setScanning(false);
        }
    };

    const changeStatus = async (status) => {
        const record = modalConfig.record;
        if (!record) return;

        if (status === record.status) {
            closeModal();
            return;
        }

        setChangingStatus(true);
        try {
            const { data } = await axios.patch(`/api/attendance/${record.record_id}/status`, { status });
            setModalConfig({ isOpen: true, status: 'success', title: 'Status changed', message: data.message, record: null });
            fetchAttendance();
        } catch (error) {
            setModalConfig({
                isOpen: true,
                status: 'error',
                title: 'Could not change status',
                message: error?.response?.data?.message ?? 'Try again.',
                record: null,
            });
        } finally {
            setChangingStatus(false);
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
                                <div className="relative h-[220px] w-[220px] rounded-lg border-2 border-rotc-gold/60">
                                    <div className="absolute -left-1 -top-1 h-5 w-5 border-l-4 border-t-4 border-rotc-maroon" />
                                    <div className="absolute -right-1 -top-1 h-5 w-5 border-r-4 border-t-4 border-rotc-maroon" />
                                    <div className="absolute -bottom-1 -left-1 h-5 w-5 border-b-4 border-l-4 border-rotc-maroon" />
                                    <div className="absolute -bottom-1 -right-1 h-5 w-5 border-b-4 border-r-4 border-rotc-maroon" />
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
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rotc-maroon px-4 py-2.5 text-xs font-medium text-white shadow hover:bg-rotc-maroon-dark active:scale-95 transition"
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
                            Formation session
                        </label>
                        {sessions.length === 0 ? (
                            <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                                No formation sessions this week. Create one on the Events page.
                            </p>
                        ) : (
                            <select
                                className="input-field"
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
                            Or type a student ID
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="input-field font-mono"
                                placeholder="e.g. 2026-00123"
                                value={studentIdNumber}
                                onChange={(e) => setStudentIdNumber(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && processScanSubmission(studentIdNumber)}
                            />
                            <button
                                type="button"
                                onClick={() => processScanSubmission(studentIdNumber)}
                                disabled={scanning || !studentIdNumber.trim() || !selectedSessionId}
                                className="btn-primary px-4"
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
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent scans</h3>
                            <p className="text-xs text-gray-500">
                                Latest scans for the selected session · Present {points.present}, Late {points.late}, Excused {points.excused}, Absent {points.absent} pts
                            </p>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-[380px] overflow-y-auto">
                        {displayedScans.length === 0 ? (
                            <div className="p-6 text-center text-xs sm:text-sm text-gray-500">
                                No scans for this session yet.
                            </div>
                        ) : (
                            displayedScans.map((scan) => (
                                <div key={scan.record_id || scan.id} className="flex items-center gap-3 px-4 py-3 sm:px-6">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                                        <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                            {scan.name}
                                        </p>
                                        <p className="text-[11px] sm:text-xs text-gray-500 font-mono">
                                            ID: {scan.student_id ?? 'N/A'} · <span className="capitalize">{scan.status}</span>
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-[11px] sm:text-xs text-emerald-700 font-mono font-medium">
                                            IN: {scan.time_in ?? '--:--'}
                                        </p>
                                        <p className="text-[11px] sm:text-xs text-rose-600 font-mono font-medium">
                                            OUT: {scan.time_out ?? '--:--'}
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
                    <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl border border-gray-100 text-center relative">
                        <button 
                            onClick={closeModal}
                            className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>

                        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
                            modalConfig.status === 'success' ? 'bg-emerald-100' : modalConfig.status === 'duplicate' ? 'bg-amber-100' : 'bg-rose-100'
                        }`}>
                            {modalConfig.status === 'success' ? (
                                <CheckCircleIcon className="h-8 w-8 text-emerald-600" />
                            ) : (
                                <ExclamationTriangleIcon className={`h-8 w-8 ${modalConfig.status === 'duplicate' ? 'text-amber-600' : 'text-rose-600'}`} />
                            )}
                        </div>

                        <h3 className="text-lg font-bold text-gray-900">{modalConfig.title}</h3>
                        <p className="mt-2 text-xs sm:text-sm text-gray-600">{modalConfig.message}</p>

                        {modalConfig.status === 'duplicate' && modalConfig.record ? (
                            <div className="mt-5 space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    {STATUS_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            disabled={changingStatus}
                                            onClick={() => changeStatus(opt.value)}
                                            className={`rounded-xl py-2.5 text-xs font-semibold text-white shadow transition disabled:opacity-50 ${opt.className} ${
                                                modalConfig.record.status === opt.value ? 'ring-2 ring-offset-2 ring-gray-900' : ''
                                            }`}
                                        >
                                            {opt.label} ({points[opt.value] ?? 0})
                                        </button>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="w-full rounded-xl bg-gray-100 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                                >
                                    Keep {String(modalConfig.record.status).toUpperCase()}
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={closeModal}
                                className={`mt-6 w-full rounded-xl py-2.5 text-xs font-semibold text-white shadow transition ${
                                    modalConfig.status === 'success'
                                        ? 'bg-emerald-600 hover:bg-emerald-700'
                                        : 'bg-rose-600 hover:bg-rose-700'
                                }`}
                            >
                                Continue scanning
                            </button>
                        )}
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}