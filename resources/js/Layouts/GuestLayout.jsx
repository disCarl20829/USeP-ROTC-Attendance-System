import { Link } from '@inertiajs/react';
import RotcLogo from '@/Components/RotcLogo';

export default function GuestLayout({ children, wide = false }) {
    return (
        <div className="flex min-h-screen flex-col bg-rotc-maroon-dark">
            {/* thin gold rule, like the seal's ring */}
            <div className="h-1 bg-rotc-gold" />

            <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
                <div className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
                    <Link href="/" className="mb-8 flex flex-col items-center text-center">
                        <RotcLogo size={96} eager className="ring-4 ring-white/10" />
                        <h1 className="mt-4 text-3xl font-semibold tracking-wide text-white">USeP ROTC Unit</h1>
                        <p className="text-sm text-rotc-gold-light">Tagum-Mabini Campus · QR Attendance</p>
                    </Link>

                    <div className="rounded-xl bg-white p-6 shadow-sm sm:p-8">{children}</div>

                    <p className="mt-6 text-center text-xs text-white/50">
                        &copy; {new Date().getFullYear()} University of Southeastern Philippines · ROTC Unit
                    </p>
                </div>
            </div>
        </div>
    );
}
