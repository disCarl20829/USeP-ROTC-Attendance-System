import { useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { 
    QrCodeIcon, 
    ArrowDownTrayIcon, 
    CalendarDaysIcon, 
    MapPinIcon, 
    ClockIcon,
    AcademicCapIcon,
    UserIcon
} from '@heroicons/react/24/outline';

export default function CadetPortal({ cadet = {}, qrCodeValue = '', upcomingEvents = [] }) {
    const qrImageRef = useRef(null);

    // QR Image URL generator (No external npm install required)
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeValue)}`;

    // Download QR Code image directly as a PNG file
    const handleDownloadQR = async () => {
        try {
            const response = await fetch(qrImageUrl);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `ROTC_QR_${cadet.student_id || 'Cadet'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Failed to download QR code:', error);
        }
    };

    return (
        <AuthenticatedLayout header="Cadet Portal">
            <Head title="Cadet Portal" />

            {/* Header Title */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Welcome, {cadet.name}</h2>
                <p className="text-sm text-gray-500">Access your digital attendance QR code and view upcoming ROTC events</p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Digital QR Pass Card */}
                <div className="card p-6 bg-white shadow rounded-lg border border-gray-200 flex flex-col items-center text-center">
                    <div className="w-full border-b pb-3 mb-4 flex items-center justify-between">
                        <span className="text-xs font-bold text-[#7B1E1E] uppercase tracking-wider">ROTC Digital ID Pass</span>
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">ACTIVE</span>
                    </div>

                    {/* QR Display */}
                    <div className="p-3 bg-white border-2 border-dashed border-gray-300 rounded-xl mb-4 shadow-inner">
                        <img 
                            ref={qrImageRef}
                            src={qrImageUrl} 
                            alt={`QR Code for ${cadet.student_id}`}
                            className="w-48 h-48 object-contain rounded-lg" 
                        />
                    </div>

                    {/* Cadet Details */}
                    <h3 className="text-lg font-bold text-gray-900">{cadet.name}</h3>
                    <p className="text-sm font-mono text-gray-600 font-semibold">{cadet.student_id}</p>
                    <p className="text-xs text-gray-500 mt-1">{cadet.course} • Platoon: {cadet.platoon}</p>

                    {/* Download Button */}
                    <button
                        onClick={handleDownloadQR}
                        className="mt-6 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 px-4 rounded-lg shadow transition"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        Download QR Code (PNG)
                    </button>
                </div>

                {/* Upcoming Events List */}
                <div className="card lg:col-span-2 p-6 bg-white shadow rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4 border-b pb-3">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <CalendarDaysIcon className="h-5 w-5 text-[#7B1E1E]" />
                            Upcoming Formation Events
                        </h3>
                        <span className="text-xs text-gray-500 font-medium">{upcomingEvents.length} Schedule(s)</span>
                    </div>

                    <div className="space-y-4">
                        {upcomingEvents.length === 0 ? (
                            <div className="py-12 text-center text-gray-500 text-sm">
                                No upcoming formation events scheduled at this time.
                            </div>
                        ) : (
                            upcomingEvents.map((event) => (
                                <div 
                                    key={event.id} 
                                    className="p-4 rounded-lg border border-gray-100 bg-gray-50/60 hover:bg-gray-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                    <div>
                                        <h4 className="font-semibold text-gray-900 text-sm">{event.title}</h4>
                                        <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                            <span className="flex items-center gap-1 font-medium text-indigo-600">
                                                <CalendarDaysIcon className="h-3.5 w-3.5" />
                                                {event.date}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <ClockIcon className="h-3.5 w-3.5" />
                                                {event.time}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPinIcon className="h-3.5 w-3.5" />
                                                {event.location}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="self-start sm:self-center px-2.5 py-1 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                        Mandatory
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