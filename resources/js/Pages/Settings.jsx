import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { UserCircleIcon, BellIcon, ShieldCheckIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

export default function Settings() {
    return (
        <AuthenticatedLayout header="Settings">
            <Head title="Settings" />

            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                <p className="text-sm text-gray-500">Manage your account and system preferences</p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Navigation */}
                <div className="card p-4">
                    <nav className="space-y-1">
                        <button className="flex w-full items-center gap-3 rounded-lg bg-[#7B1E1E]/10 px-4 py-3 text-sm font-medium text-[#7B1E1E]">
                            <UserCircleIcon className="h-5 w-5" />
                            Profile
                        </button>
                        <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50">
                            <BellIcon className="h-5 w-5" />
                            Notifications
                        </button>
                        <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50">
                            <ShieldCheckIcon className="h-5 w-5" />
                            Security
                        </button>
                        <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50">
                            <Cog6ToothIcon className="h-5 w-5" />
                            System
                        </button>
                    </nav>
                </div>

                {/* Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Profile section */}
                    <div className="card p-6">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">Profile Information</h3>
                        <div className="flex items-center gap-6 mb-6">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#7B1E1E] text-2xl font-bold text-white">
                                TU
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Test User</p>
                                <p className="text-sm text-gray-500">test@example.com</p>
                                <button className="mt-2 text-sm text-[#7B1E1E] hover:underline">Change avatar</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="label-text">Full Name</label>
                                <input type="text" className="input-field" defaultValue="Test User" />
                            </div>
                            <div>
                                <label className="label-text">Email</label>
                                <input type="email" className="input-field" defaultValue="test@example.com" />
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button className="btn-primary">Save Changes</button>
                        </div>
                    </div>

                    {/* Notification settings */}
                    <div className="card p-6">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">Notification Preferences</h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Email notifications', description: 'Receive email updates about events' },
                                { label: 'Attendance reminders', description: 'Get reminded before events start' },
                                { label: 'Weekly reports', description: 'Receive weekly attendance summary' },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900">{item.label}</p>
                                        <p className="text-sm text-gray-500">{item.description}</p>
                                    </div>
                                    <label className="relative inline-flex cursor-pointer items-center">
                                        <input type="checkbox" className="peer sr-only" defaultChecked />
                                        <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:bg-[#7B1E1E] peer-checked:after:translate-x-full"></div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
