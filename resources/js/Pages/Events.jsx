import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, useForm } from '@inertiajs/react';
import { PlusIcon, CalendarDaysIcon, MapPinIcon, ClockIcon, UsersIcon } from '@heroicons/react/24/outline';

export default function Events({ events = [] }) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        formation_name: '',
        formation_date: '',
        formation_type: 'half_day',
        location: 'PECC Gym',
        start_time: '06:30',
        end_time: '12:00',
    });

    const openCreateModal = () => {
        reset();
        clearErrors();
        setIsCreateModalOpen(true);
    };

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        reset();
    };

    const handleCreateEventSubmit = (e) => {
        e.preventDefault();
        post('/events', {
            onSuccess: () => closeCreateModal(),
        });
    };

    return (
        <AuthenticatedLayout header="Events">
            <Head title="Events" />

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Event Management</h2>
                    <p className="text-sm text-gray-500">Create and manage ROTC events and training activities</p>
                </div>
                <button onClick={openCreateModal} className="btn-primary flex items-center">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Create Event
                </button>
            </div>

            {events.length === 0 ? (
                <div className="card p-12 text-center text-gray-500">
                    No events scheduled yet. Click <strong>"Create Event"</strong> to add one.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {events.map((event) => {
                        const attendancePercentage = event.capacity > 0 
                            ? Math.min(100, Math.round((event.attendees / event.capacity) * 100)) 
                            : 0;

                        return (
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
                                            <span>Attendance Rate</span>
                                            <span>{attendancePercentage}%</span>
                                        </div>
                                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                                            <div
                                                className="h-full rounded-full bg-[#7B1E1E] transition-all duration-500"
                                                style={{ width: `${attendancePercentage}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-6 flex gap-3">
                                        <button className="btn-primary flex-1 justify-center">View Details</button>
                                        <button className="btn-secondary">Edit</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Event Modal */}
            <Modal show={isCreateModalOpen} onClose={closeCreateModal}>
                <form onSubmit={handleCreateEventSubmit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">Create New Event</h2>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="formation_name" value="Event Name" />
                            <TextInput
                                id="formation_name"
                                type="text"
                                className="mt-1 block w-full"
                                value={data.formation_name}
                                onChange={(e) => setData('formation_name', e.target.value)}
                                placeholder="e.g. Morning Formation"
                                required
                            />
                            <InputError message={errors.formation_name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="formation_date" value="Date" />
                            <TextInput
                                id="formation_date"
                                type="date"
                                className="mt-1 block w-full"
                                value={data.formation_date}
                                onChange={(e) => setData('formation_date', e.target.value)}
                                required
                            />
                            <InputError message={errors.formation_date} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="formation_type" value="Event Type" />
                            <select
                                id="formation_type"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={data.formation_type}
                                onChange={(e) => setData('formation_type', e.target.value)}
                            >
                                <option value="whole_day">Whole Day</option>
                                <option value="half_day">Half Day</option>
                            </select>
                            <InputError message={errors.formation_type} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="location" value="Location" />
                            <TextInput
                                id="location"
                                type="text"
                                className="mt-1 block w-full"
                                value={data.location}
                                onChange={(e) => setData('location', e.target.value)}
                                placeholder="e.g. Parade Ground"
                            />
                            <InputError message={errors.location} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="start_time" value="Start Time" />
                            <TextInput
                                id="start_time"
                                type="time"
                                className="mt-1 block w-full"
                                value={data.start_time}
                                onChange={(e) => setData('start_time', e.target.value)}
                            />
                            <InputError message={errors.start_time} className="mt-2" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={closeCreateModal}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={processing}>Save Event</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}