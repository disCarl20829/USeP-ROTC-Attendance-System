import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { UserCircleIcon, BellIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

export default function Settings({ utility = {}, user = {} }) {
    const [activeTab, setActiveTab] = useState('profile');

    // System Settings Form
    const systemForm = useForm({
        default_start_time: utility.default_start_time ?? '08:00',
        default_end_time: utility.default_end_time ?? '17:00',
        default_late_time: utility.default_late_time ?? '08:15',
    });

    // Profile Form
    const profileForm = useForm({
        first_name: user.first_name ?? '',
        last_name: user.last_name ?? '',
        email: user.email ?? '',
    });

    const handleSystemSubmit = (e) => {
        e.preventDefault();
        systemForm.put('/settings');
    };

    const handleProfileSubmit = (e) => {
        e.preventDefault();
        profileForm.patch('/profile');
    };

    // Calculate dynamic avatar initials from user record
    const initials = `${user.first_name?.[0] ?? 'U'}${user.last_name?.[0] ?? 'S'}`.toUpperCase();
    const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'Cadet Officer';

    return (
        <AuthenticatedLayout header="Settings">
            <Head title="Settings" />

            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                <p className="text-sm text-gray-500">Manage your account and system preferences</p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Sidebar Navigation */}
                <div className="card p-4 bg-white shadow rounded-lg border border-gray-100 h-fit">
                    <nav className="space-y-1">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                                activeTab === 'profile'
                                    ? 'bg-[#7B1E1E]/10 text-[#7B1E1E]'
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <UserCircleIcon className="h-5 w-5" />
                            Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                                activeTab === 'notifications'
                                    ? 'bg-[#7B1E1E]/10 text-[#7B1E1E]'
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <BellIcon className="h-5 w-5" />
                            Notifications
                        </button>
                        <button
                            onClick={() => setActiveTab('system')}
                            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                                activeTab === 'system'
                                    ? 'bg-[#7B1E1E]/10 text-[#7B1E1E]'
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <Cog6ToothIcon className="h-5 w-5" />
                            System Default Times
                        </button>
                    </nav>
                </div>

                {/* Content Panel */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Profile Section */}
                    {activeTab === 'profile' && (
                        <div className="card p-6 bg-white shadow rounded-lg border border-gray-100">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">Profile Information</h3>
                            <div className="flex items-center gap-6 mb-6">
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#7B1E1E] text-2xl font-bold text-white shadow-sm">
                                    {initials}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-lg">{fullName}</p>
                                    <p className="text-sm text-gray-500 font-mono">{user.email}</p>
                                </div>
                            </div>

                            <form onSubmit={handleProfileSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">First Name</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            value={profileForm.data.first_name}
                                            onChange={(e) => profileForm.setData('first_name', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            value={profileForm.data.last_name}
                                            onChange={(e) => profileForm.setData('last_name', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Email</label>
                                    <input
                                        type="email"
                                        className="w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        value={profileForm.data.email}
                                        onChange={(e) => profileForm.setData('email', e.target.value)}
                                    />
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={profileForm.processing}
                                        className="px-4 py-2 bg-[#7B1E1E] text-white rounded-md text-sm font-medium hover:bg-[#601717] disabled:opacity-50"
                                    >
                                        Save Profile Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Notification Preferences */}
                    {activeTab === 'notifications' && (
                        <div className="card p-6 bg-white shadow rounded-lg border border-gray-100">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">Notification Preferences</h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Email notifications', description: 'Receive email updates about events' },
                                    { label: 'Attendance reminders', description: 'Get reminded before events start' },
                                    { label: 'Weekly reports', description: 'Receive weekly attendance summary' },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">{item.label}</p>
                                            <p className="text-xs text-gray-500">{item.description}</p>
                                        </div>
                                        <label className="relative inline-flex cursor-pointer items-center">
                                            <input type="checkbox" className="peer sr-only" defaultChecked />
                                            <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:bg-[#7B1E1E] peer-checked:after:translate-x-full"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* System Default Session Times */}
                    {activeTab === 'system' && (
                        <div className="card p-6 bg-white shadow rounded-lg border border-gray-100">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">System Default Session Times</h3>
                            <form onSubmit={handleSystemSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Start Time</label>
                                        <input
                                            type="time"
                                            className="w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            value={systemForm.data.default_start_time}
                                            onChange={(e) => systemForm.setData('default_start_time', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Late Threshold</label>
                                        <input
                                            type="time"
                                            className="w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            value={systemForm.data.default_late_time}
                                            onChange={(e) => systemForm.setData('default_late_time', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">End Time</label>
                                        <input
                                            type="time"
                                            className="w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            value={systemForm.data.default_end_time}
                                            onChange={(e) => systemForm.setData('default_end_time', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={systemForm.processing}
                                        className="px-4 py-2 bg-[#7B1E1E] text-white rounded-md text-sm font-medium hover:bg-[#601717] disabled:opacity-50"
                                    >
                                        Save Default Times
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}