import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PlusIcon, CalendarDaysIcon, MapPinIcon, ClockIcon, UsersIcon } from '@heroicons/react/24/outline';

const events = [
    { id: 1, name: 'Morning Formation', date: 'Oct 15, 2026', time: '06:00 AM', location: 'Parade Ground', attendees: 245, capacity: 258, status: 'upcoming' },
    { id: 2, name: 'Battalion Drill', date: 'Oct 18, 2026', time: '06:00 AM', location: 'Parade Ground', attendees: 0, capacity: 258, status: 'upcoming' },
    { id: 3, name: 'Leadership Seminar', date: 'Oct 20, 2026', time: '01:00 PM', location: 'ROTC Office', attendees: 0, capacity: 100, status: 'upcoming' },
    { id: 4, name: 'Physical Training', date: 'Oct 10, 2026', time: '05:30 AM', location: 'Track Oval', attendees: 238, capacity: 258, status: 'completed' },
    { id: 5, name: 'Flag Ceremony', date: 'Oct 5, 2026', time: '07:00 AM', location: 'Main Plaza', attendees: 250, capacity: 258, status: 'completed' },
];

export default function Events() {
    return (
        <AuthenticatedLayout header="Events">
            <Head title="Events" />

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Event Management</h2>
                    <p className="text-sm text-gray-500">Create and manage ROTC events and training activities</p>
                </div>
                <button className="btn-primary">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Create Event
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {events.map((event) => (
                    <div key={event.id} className="card overflow-hidden">
                        <div className="h-2 bg-[#7B1E1E]" />
                        <div className="p-6">
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                                    <span
                                        className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                            event.status === 'upcoming'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}
                                    >
                                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                                    {event.date}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <ClockIcon className="h-4 w-4 text-gray-400" />
                                    {event.time}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <MapPinIcon className="h-4 w-4 text-gray-400" />
                                    {event.location}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <UsersIcon className="h-4 w-4 text-gray-400" />
                                    {event.attendees}/{event.capacity} attendees
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-4">
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>Attendance</span>
                                    <span>{Math.round((event.attendees / event.capacity) * 100)}%</span>
                                </div>
                                <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                                    <div
                                        className="h-full rounded-full bg-[#7B1E1E] transition-all duration-500"
                                        style={{ width: `${(event.attendees / event.capacity) * 100}%` }}
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button className="btn-primary flex-1 justify-center">View Details</button>
                                <button className="btn-secondary">Edit</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </AuthenticatedLayout>
    );
}
