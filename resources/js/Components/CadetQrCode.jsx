import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

/**
 * The cadet's personal attendance QR, drawn in the browser (no external service).
 * `value` is the cadet's private QR token.
 */
export default function CadetQrCode({ value, studentId, name, size = 220 }) {
    const wrapper = useRef(null);

    const download = () => {
        const canvas = wrapper.current?.querySelector('canvas');
        if (!canvas) return;
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `ROTC_QR_${studentId || 'Cadet'}.png`;
        link.click();
    };

    if (!value) {
        return <p className="text-sm text-gray-500">No QR code yet.</p>;
    }

    return (
        <div className="flex flex-col items-center">
            <div ref={wrapper} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <QRCodeCanvas value={value} size={size} level="M" marginSize={2} title={`QR code for ${name ?? 'cadet'}`} />
            </div>
            <button type="button" onClick={download} className="btn-secondary mt-4 gap-2">
                <ArrowDownTrayIcon className="h-4 w-4" />
                Download QR (PNG)
            </button>
            <p className="mt-2 max-w-xs text-center text-xs text-gray-500">
                Show this at formation. Keep it private — anyone with it can be scanned as you.
            </p>
        </div>
    );
}
