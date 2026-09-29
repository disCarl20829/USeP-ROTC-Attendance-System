import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { QrCodeIcon, CameraIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const recentScans = [
    { id: 1, cadet: 'Juan Dela Cruz', idNumber: '2021-0001', event: 'Morning Formation', time: '06:00 AM', status: 'valid' },
    { id: 2, cadet: 'Maria Santos', idNumber: '2021-0002', event: 'Morning Formation', time: '06:01 AM', status: 'valid' },
    { id: 3, cadet: 'Pedro Reyes', idNumber: '2021-0003', event: 'Morning Formation', time: '06:15 AM', status: 'late' },
    { id: 4, cadet: 'Unknown', idNumber: '-', event: 'Morning Formation', time: '06:20 AM', status: 'invalid' },
];

export default function QRScanner() {
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

                    {/* Event selector */}
                    <div className="mb-4">
                        <label className="label-text">Select Event</label>
                        <select className="input-field">
                            <option>Morning Formation - Oct 15, 2026</option>
                            <option>Battalion Drill - Oct 18, 2026</option>
                            <option>Physical Training - Oct 20, 2026</option>
                        </select>
                    </div>

                    <button className="btn-primary w-full justify-center">
                        <CameraIcon className="mr-2 h-4 w-4" />
                        Start Scanning
                    </button>
                </div>

                {/* Recent scans */}
                <div className="card">
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Scans</h3>
                        <p className="text-sm text-gray-500">Latest attendance records from QR scans</p>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {recentScans.map((scan) => (
                            <div key={scan.id} className="flex items-center gap-4 px-6 py-4">
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                        scan.status === 'valid'
                                            ? 'bg-green-100'
                                            : scan.status === 'late'
                                            ? 'bg-yellow-100'
                                            : 'bg-red-100'
                                    }`}
                                >
                                    {scan.status === 'valid' && <CheckCircleIcon className="h-5 w-5 text-green-600" />}
                                    {scan.status === 'late' && <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />}
                                    {scan.status === 'invalid' && <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-gray-900">{scan.cadet}</p>
                                    <p className="text-sm text-gray-500">
                                        {scan.idNumber !== '-' && `${scan.idNumber} - `}{scan.event}
                                    </p>
                                </div>
                                <span className="text-sm text-gray-500">{scan.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
