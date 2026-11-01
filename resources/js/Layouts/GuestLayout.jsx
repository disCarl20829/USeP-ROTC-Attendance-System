import { Link } from '@inertiajs/react';

function ShieldIcon({ className = 'h-10 w-10' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
    );
}

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#5C1515] via-[#7B1E1E] to-[#3D0F0F] px-4 py-8">
            <div className="w-full max-w-md">
                <div className="mb-8 flex flex-col items-center">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 shadow-lg backdrop-blur-sm">
                        <ShieldIcon className="h-10 w-10 text-[#D4A843]" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">USeP ROTC</h1>
                    <p className="mt-1 text-sm text-gray-300">QR Attendance System</p>
                </div>

                <div className="rounded-2xl bg-white p-8 shadow-2xl">
                    {children}
                </div>

                <p className="mt-6 text-center text-xs text-gray-400">
                    &copy; {new Date().getFullYear()} USeP ROTC Unit - Tagum-Mabini Campus
                </p>
            </div>
        </div>
    );
}
