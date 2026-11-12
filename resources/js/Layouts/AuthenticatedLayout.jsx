import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';

const icons = {
    home: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75',
    users: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
    calendar: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
    clipboard: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z',
    qrcode: 'M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z M2.25 15.75a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 00-.75.75v4.5z M12.75 15.75a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 00-.75.75v4.5z',
    chart: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
    logout: 'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9',
    bars: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5',
};

function Icon({ name, className = 'h-5 w-5' }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d={icons[name] || ''} />
        </svg>
    );
}

const allNavigation = [
    { name: 'Dashboard', href: 'dashboard', icon: 'home' },
    { name: 'Cadets', href: 'cadets', icon: 'users' },
    { name: 'Events', href: 'events', icon: 'calendar' },
    { name: 'Attendance', href: 'attendance', icon: 'clipboard' },
    { name: 'QR Scanner', href: 'qr-scanner', icon: 'qrcode' },
    { name: 'Reports', href: 'reports', icon: 'chart' },
];

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth?.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const currentRoute = route().current();

    // Filter navigation items safely according to user permissions
    const navigation = allNavigation.filter((item) => {
        // 1. Dashboard is always visible
        if (item.href === 'dashboard') return true;

        // 2. Grant full navigation access if user is admin/system_admin or role matches
        if (
            !user || 
            user?.is_system_admin || 
            user?.is_admin || 
            ['admin', 'officer', 'system admin', 'test'].includes(user?.role?.toLowerCase())
        ) {
            return true;
        }

        // 3. Scanners see Attendance & QR Scanner
        if (user?.is_scanner || ['aspirant', 'scanner'].includes(user?.role?.toLowerCase())) {
            return item.href === 'attendance' || item.href === 'qr-scanner';
        }

        return false;
    });

    return (
        <div className="min-h-screen bg-gray-50">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-[#5C1515] transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex h-full flex-col">
                    <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                            <svg className="h-6 w-6 text-[#D4A843]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-white">USeP ROTC</h1>
                            <p className="text-xs text-gray-300">QR Attendance System</p>
                        </div>
                    </div>

                    <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
                        {navigation.map((item) => {
                            const isActive = currentRoute === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={route(item.href)}
                                    className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <Icon name={item.icon} className="h-5 w-5 shrink-0" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="border-t border-white/10 p-4">
                        <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D4A843] text-sm font-bold text-[#5C1515]">
                                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-white">{user?.name || 'Admin User'}</p>
                                <p className="truncate text-xs text-gray-400 capitalize">{user?.role || 'Admin'}</p>
                            </div>
                        </div>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 transition-all duration-200 hover:bg-white/10 hover:text-white"
                        >
                            <Icon name="logout" className="h-5 w-5" />
                            Sign Out
                        </Link>
                    </div>
                </div>
            </aside>

            <div className="lg:pl-72">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md sm:px-6">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
                    >
                        <Icon name="bars" className="h-6 w-6" />
                    </button>

                    {header && (
                        <h1 className="text-lg font-semibold text-gray-900">{header}</h1>
                    )}
                </header>

                <main className="p-4 sm:p-6 lg:p-8">{children}</main>
            </div>
        </div>
    );
}