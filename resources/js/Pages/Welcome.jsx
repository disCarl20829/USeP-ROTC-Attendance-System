import { Head, Link } from '@inertiajs/react';

function ShieldIcon({ className = 'h-10 w-10' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
    );
}

function QrIcon({ className = 'h-8 w-8' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z M2.25 15.75a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 00-.75.75v4.5z M12.75 15.75a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 00-.75.75v4.5z" />
        </svg>
    );
}

function UsersIcon({ className = 'h-8 w-8' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
    );
}

function ChartIcon({ className = 'h-8 w-8' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
    );
}

export default function Welcome({ auth, laravelVersion, phpVersion }) {
    return (
        <>
            <Head title="Welcome" />
            <div className="min-h-screen bg-gradient-to-br from-[#5C1515] via-[#7B1E1E] to-[#3D0F0F]">
                <header className="border-b border-white/10">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                                <ShieldIcon className="h-6 w-6 text-[#D4A843]" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white">USeP ROTC</h1>
                                <p className="text-xs text-gray-300">QR Attendance System</p>
                            </div>
                        </div>
                        <nav className="flex items-center gap-4">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#7B1E1E] transition-colors hover:bg-gray-100"
                                    >
                                        Register
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl px-6 py-20">
                    <div className="text-center">
                        <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                            USeP ROTC Unit
                        </h2>
                        <p className="mt-4 text-xl text-gray-300">
                            Tagum-Mabini Campus
                        </p>
                        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
                            A modern QR-based attendance system for tracking cadet participation in ROTC events and training activities.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-4">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#7B1E1E] shadow-lg transition-all hover:bg-gray-100 hover:shadow-xl"
                                >
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('register')}
                                        className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#7B1E1E] shadow-lg transition-all hover:bg-gray-100 hover:shadow-xl"
                                    >
                                        Get Started
                                    </Link>
                                    <Link
                                        href={route('login')}
                                        className="rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10"
                                    >
                                        Sign In
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { icon: QrIcon, title: 'QR Scanning', desc: 'Quick and easy attendance tracking with QR codes' },
                            { icon: UsersIcon, title: 'Cadet Management', desc: 'Manage all cadet information in one place' },
                            { icon: ChartIcon, title: 'Reports & Analytics', desc: 'Detailed attendance reports and insights' },
                            { icon: ShieldIcon, title: 'Secure', desc: 'Secure and reliable attendance system' },
                        ].map((feature) => (
                            <div
                                key={feature.title}
                                className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:bg-white/10"
                            >
                                <feature.icon className="h-8 w-8 text-[#D4A843]" />
                                <h3 className="mt-4 text-lg font-semibold text-white">{feature.title}</h3>
                                <p className="mt-2 text-sm text-gray-400">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </main>

                <footer className="border-t border-white/10 py-8">
                    <p className="text-center text-sm text-gray-400">
                        &copy; {new Date().getFullYear()} USeP ROTC Unit - Tagum-Mabini Campus. All rights reserved.
                    </p>
                </footer>
            </div>
        </>
    );
}
