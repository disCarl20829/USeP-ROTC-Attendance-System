import { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, useForm, router } from '@inertiajs/react';
import { 
    PlusIcon, 
    CalendarDaysIcon, 
    MapPinIcon, 
    ClockIcon, 
    UsersIcon, 
    PencilSquareIcon, 
    TrashIcon, 
    EyeIcon, 
    ExclamationTriangleIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

export default function Events({ events = [] }) {
    // Normalizing events payload (handles both standard array & Laravel paginated object)
    const rawEventsList = Array.isArray(events) ? events : (events?.data || []);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 6;

    // Modal Control States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Currently Selected Event Object
    const [selectedEvent, setSelectedEvent] = useState(null);

    // 1. Create Event Form
    const createForm = useForm({
        formation_name: '',
        formation_date: '',
        formation_type: 'half_day',
        location: 'PECC Gym',
        start_time: '06:30',
        end_time: '12:00',
        late_time: '07:00', // Cutoff time for marking cadets Late
    });

    // 2. Edit Event Form
    const editForm = useForm({
        id: '',
        formation_name: '',
        formation_date: '',
        formation_type: 'half_day',
        location: '',
        start_time: '',
        end_time: '',
        late_time: '',
    });

    // Pagination Slice
    const totalPages = Math.ceil(rawEventsList.length / ITEMS_PER_PAGE) || 1;
    const paginatedEvents = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return rawEventsList.slice(start, start + ITEMS_PER_PAGE);
    }, [rawEventsList, currentPage]);

    // Handlers for Create Modal
    const openCreateModal = () => {
        createForm.reset();
        createForm.clearErrors();
        setIsCreateModalOpen(true);
    };

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        createForm.reset();
    };

    const handleCreateEventSubmit = (e) => {
        e.preventDefault();
        createForm.post('/events', {
            onSuccess: () => closeCreateModal(),
        });
    };

    // Handlers for Edit Modal
    const openEditModal = (event) => {
        setSelectedEvent(event);
        editForm.clearErrors();
        editForm.setData({
            id: event.id || event.session_id,
            formation_name: event.name || event.formation_name || '',
            formation_date: event.rawDate || event.formation_date || event.date || '',
            formation_type: event.formation_type || event.session_type || 'half_day',
            location: event.location || 'PECC Gym',
            start_time: event.start_time || '06:30',
            end_time: event.end_time || '12:00',
            late_time: event.late_time || '07:00',
        });
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedEvent(null);
        editForm.reset();
    };

    const handleEditEventSubmit = (e) => {
        e.preventDefault();
        const eventId = editForm.data.id;
        editForm.put(`/events/${eventId}`, {
            onSuccess: () => closeEditModal(),
        });
    };

    // Handlers for View Details Modal
    const openDetailsModal = (event) => {
        setSelectedEvent(event);
        setIsDetailsModalOpen(true);
    };

    const closeDetailsModal = () => {
        setIsDetailsModalOpen(false);
        setSelectedEvent(null);
    };

    // Handlers for Delete / Cancel Event Modal
    const openDeleteModal = (event) => {
        setSelectedEvent(event);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedEvent(null);
    };

    const handleDeleteEventConfirm = () => {
        if (!selectedEvent) return;
        const eventId = selectedEvent.id || selectedEvent.session_id;

        router.delete(`/events/${eventId}`, {
            onSuccess: () => {
                closeDeleteModal();
                if (paginatedEvents.length === 1 && currentPage > 1) {
                    setCurrentPage((prev) => prev - 1);
                }
            },
        });
    };

    return (
        <AuthenticatedLayout header="Events">
            <Head title="Events" />

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Event Management</h2>
                    <p className="text-sm text-gray-500">Create, schedule, and track ROTC formation sessions and activities</p>
                </div>
                <button onClick={openCreateModal} className="btn-primary flex items-center justify-center gap-2">
                    <PlusIcon className="h-4 w-4" />
                    Create Event
                </button>
            </div>

            {/* Events Grid */}
            {rawEventsList.length === 0 ? (
                <div className="card p-12 text-center text-gray-500 bg-white shadow rounded-lg border border-gray-200">
                    No events scheduled yet. Click <strong className="text-gray-800">"Create Event"</strong> to add one.
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {paginatedEvents.map((event) => {
                            const eventId = event.id || event.session_id;
                            const attendees = event.attendees ?? 0;
                            const capacity = event.capacity ?? 100;
                            const attendancePercentage = capacity > 0 
                                ? Math.min(100, Math.round((attendees / capacity) * 100)) 
                                : 0;

                            const status = event.status || 'upcoming';

                            return (
                                <div key={eventId} className="card overflow-hidden bg-white shadow rounded-lg border border-gray-200 flex flex-col justify-between">
                                    <div>
                                        <div className="h-2 bg-[#7B1E1E]" />
                                        <div className="p-6">
                                            <div className="mb-4 flex items-start justify-between gap-2">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900">{event.name || event.formation_name}</h3>
                                                    <span
                                                        className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                            status === 'completed'
                                                                ? 'bg-gray-100 text-gray-700'
                                                                : status === 'ongoing'
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : 'bg-blue-100 text-blue-700'
                                                        }`}
                                                    >
                                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                                    </span>
                                                </div>

                                                <button
                                                    onClick={() => openDeleteModal(event)}
                                                    title="Cancel/Delete Event"
                                                    className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="space-y-2.5 text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <CalendarDaysIcon className="h-4 w-4 text-gray-400 shrink-0" />
                                                    <span>{event.date || event.formation_date}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <ClockIcon className="h-4 w-4 text-gray-400 shrink-0" />
                                                    <span>
                                                        {event.time || `${event.start_time || '06:30'} - ${event.end_time || '12:00'}`}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPinIcon className="h-4 w-4 text-gray-400 shrink-0" />
                                                    <span>{event.location || 'PECC Gym'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <UsersIcon className="h-4 w-4 text-gray-400 shrink-0" />
                                                    <span>{attendees} / {capacity} Attendees</span>
                                                </div>
                                            </div>

                                            {/* Attendance Rate Progress Bar */}
                                            <div className="mt-4">
                                                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                                    <span>Attendance Rate</span>
                                                    <span className="font-semibold text-gray-700">{attendancePercentage}%</span>
                                                </div>
                                                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                                    <div
                                                        className="h-full rounded-full bg-[#7B1E1E] transition-all duration-500"
                                                        style={{ width: `${attendancePercentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="p-6 pt-0 flex gap-2">
                                        <button
                                            onClick={() => openDetailsModal(event)}
                                            className="btn-primary flex-1 justify-center flex items-center gap-1.5 text-xs py-2"
                                        >
                                            <EyeIcon className="h-3.5 w-3.5" /> View Details
                                        </button>
                                        <button
                                            onClick={() => openEditModal(event)}
                                            className="btn-secondary flex items-center gap-1.5 text-xs py-2 px-3"
                                        >
                                            <PencilSquareIcon className="h-3.5 w-3.5" /> Edit
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination Bar */}
                    {totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm">
                            <div className="text-xs text-gray-500">
                                Showing Page <span className="font-semibold text-gray-800">{currentPage}</span> of{' '}
                                <span className="font-semibold text-gray-800">{totalPages}</span> ({rawEventsList.length} total events)
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-40"
                                >
                                    <ChevronLeftIcon className="h-3.5 w-3.5" /> Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-40"
                                >
                                    Next <ChevronRightIcon className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* 1. CREATE EVENT MODAL */}
            <Modal show={isCreateModalOpen} onClose={closeCreateModal}>
                <form onSubmit={handleCreateEventSubmit} className="p-6">
                    <div className="flex items-center justify-between border-b pb-3 mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Create New Event</h2>
                        <button type="button" onClick={closeCreateModal} className="text-gray-400 hover:text-gray-600">
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="create_formation_name" value="Event Name" />
                            <TextInput
                                id="create_formation_name"
                                type="text"
                                className="mt-1 block w-full text-sm"
                                value={createForm.data.formation_name}
                                onChange={(e) => createForm.setData('formation_name', e.target.value)}
                                placeholder="e.g. Morning Formation Session"
                                required
                            />
                            <InputError message={createForm.errors.formation_name} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="create_formation_date" value="Date" />
                            <TextInput
                                id="create_formation_date"
                                type="date"
                                className="mt-1 block w-full text-sm"
                                value={createForm.data.formation_date}
                                onChange={(e) => createForm.setData('formation_date', e.target.value)}
                                required
                            />
                            <InputError message={createForm.errors.formation_date} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="create_formation_type" value="Event Duration / Type" />
                            <select
                                id="create_formation_type"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={createForm.data.formation_type}
                                onChange={(e) => createForm.setData('formation_type', e.target.value)}
                            >
                                <option value="half_day">Half Day</option>
                                <option value="whole_day">Whole Day</option>
                            </select>
                            <InputError message={createForm.errors.formation_type} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="create_location" value="Location" />
                            <TextInput
                                id="create_location"
                                type="text"
                                className="mt-1 block w-full text-sm"
                                value={createForm.data.location}
                                onChange={(e) => createForm.setData('location', e.target.value)}
                                placeholder="e.g. PECC Gym / Parade Ground"
                            />
                            <InputError message={createForm.errors.location} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="create_start_time" value="Start Time" />
                            <TextInput
                                id="create_start_time"
                                type="time"
                                className="mt-1 block w-full text-sm"
                                value={createForm.data.start_time}
                                onChange={(e) => createForm.setData('start_time', e.target.value)}
                            />
                            <InputError message={createForm.errors.start_time} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="create_end_time" value="End Time" />
                            <TextInput
                                id="create_end_time"
                                type="time"
                                className="mt-1 block w-full text-sm"
                                value={createForm.data.end_time}
                                onChange={(e) => createForm.setData('end_time', e.target.value)}
                            />
                            <InputError message={createForm.errors.end_time} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="create_late_time" value="Late Cutoff Timestamp (Late Threshold)" />
                            <TextInput
                                id="create_late_time"
                                type="time"
                                className="mt-1 block w-full text-sm border-amber-300 focus:border-amber-500 focus:ring-amber-500"
                                value={createForm.data.late_time}
                                onChange={(e) => createForm.setData('late_time', e.target.value)}
                            />
                            <p className="mt-1 text-[11px] text-amber-700">Scans after this time will automatically mark cadets as "Late".</p>
                            <InputError message={createForm.errors.late_time} className="mt-1" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                        <SecondaryButton onClick={closeCreateModal}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={createForm.processing}>Save Event</PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* 2. EDIT EVENT MODAL */}
            <Modal show={isEditModalOpen} onClose={closeEditModal}>
                <form onSubmit={handleEditEventSubmit} className="p-6">
                    <div className="flex items-center justify-between border-b pb-3 mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Edit Event Settings</h2>
                        <button type="button" onClick={closeEditModal} className="text-gray-400 hover:text-gray-600">
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="edit_formation_name" value="Event Name" />
                            <TextInput
                                id="edit_formation_name"
                                type="text"
                                className="mt-1 block w-full text-sm"
                                value={editForm.data.formation_name}
                                onChange={(e) => editForm.setData('formation_name', e.target.value)}
                                required
                            />
                            <InputError message={editForm.errors.formation_name} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_formation_date" value="Date" />
                            <TextInput
                                id="edit_formation_date"
                                type="date"
                                className="mt-1 block w-full text-sm"
                                value={editForm.data.formation_date}
                                onChange={(e) => editForm.setData('formation_date', e.target.value)}
                                required
                            />
                            <InputError message={editForm.errors.formation_date} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_formation_type" value="Event Duration / Type" />
                            <select
                                id="edit_formation_type"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={editForm.data.formation_type}
                                onChange={(e) => editForm.setData('formation_type', e.target.value)}
                            >
                                <option value="half_day">Half Day</option>
                                <option value="whole_day">Whole Day</option>
                            </select>
                            <InputError message={editForm.errors.formation_type} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_location" value="Location" />
                            <TextInput
                                id="edit_location"
                                type="text"
                                className="mt-1 block w-full text-sm"
                                value={editForm.data.location}
                                onChange={(e) => editForm.setData('location', e.target.value)}
                            />
                            <InputError message={editForm.errors.location} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_start_time" value="Start Time" />
                            <TextInput
                                id="edit_start_time"
                                type="time"
                                className="mt-1 block w-full text-sm"
                                value={editForm.data.start_time}
                                onChange={(e) => editForm.setData('start_time', e.target.value)}
                            />
                            <InputError message={editForm.errors.start_time} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_end_time" value="End Time" />
                            <TextInput
                                id="edit_end_time"
                                type="time"
                                className="mt-1 block w-full text-sm"
                                value={editForm.data.end_time}
                                onChange={(e) => editForm.setData('end_time', e.target.value)}
                            />
                            <InputError message={editForm.errors.end_time} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_late_time" value="Late Cutoff Timestamp (Late Threshold)" />
                            <TextInput
                                id="edit_late_time"
                                type="time"
                                className="mt-1 block w-full text-sm border-amber-300 focus:border-amber-500 focus:ring-amber-500"
                                value={editForm.data.late_time}
                                onChange={(e) => editForm.setData('late_time', e.target.value)}
                            />
                            <p className="mt-1 text-[11px] text-amber-700">Scans after this time will automatically mark cadets as "Late".</p>
                            <InputError message={editForm.errors.late_time} className="mt-1" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                        <SecondaryButton onClick={closeEditModal}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={editForm.processing}>Update Event</PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* 3. VIEW DETAILS MODAL */}
            <Modal show={isDetailsModalOpen} onClose={closeDetailsModal}>
                {selectedEvent && (
                    <div className="p-6">
                        <div className="flex items-start justify-between border-b pb-3 mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{selectedEvent.name || selectedEvent.formation_name}</h2>
                                <span className="mt-1 inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                                    {(selectedEvent.status || 'Upcoming').toUpperCase()}
                                </span>
                            </div>
                            <button onClick={closeDetailsModal} className="text-gray-400 hover:text-gray-600">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700 mb-6">
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <p className="text-xs text-gray-400 font-semibold uppercase">Date Scheduled</p>
                                <p className="font-semibold text-gray-900 mt-1 flex items-center gap-1.5">
                                    <CalendarDaysIcon className="h-4 w-4 text-indigo-600" />
                                    {selectedEvent.date || selectedEvent.formation_date}
                                </p>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <p className="text-xs text-gray-400 font-semibold uppercase">Location</p>
                                <p className="font-semibold text-gray-900 mt-1 flex items-center gap-1.5">
                                    <MapPinIcon className="h-4 w-4 text-indigo-600" />
                                    {selectedEvent.location || 'PECC Gym'}
                                </p>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <p className="text-xs text-gray-400 font-semibold uppercase">Session Time Window</p>
                                <p className="font-semibold text-gray-900 mt-1 flex items-center gap-1.5 font-mono">
                                    <ClockIcon className="h-4 w-4 text-indigo-600" />
                                    {selectedEvent.time || `${selectedEvent.start_time || '06:30'} - ${selectedEvent.end_time || '12:00'}`}
                                </p>
                            </div>

                            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                                <p className="text-xs text-amber-700 font-bold uppercase">Late Threshold Timestamp</p>
                                <p className="font-semibold text-amber-900 mt-1 flex items-center gap-1.5 font-mono">
                                    <ClockIcon className="h-4 w-4 text-amber-600" />
                                    {selectedEvent.late_time || '07:00 AM'}
                                </p>
                            </div>
                        </div>

                        {/* Attendance Stats Card */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                            <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Attendance Summary</h4>
                            <div className="flex items-center justify-between text-sm mb-1.5">
                                <span className="text-gray-600">Total Attendees Logged</span>
                                <span className="font-bold font-mono text-gray-900">
                                    {selectedEvent.attendees ?? 0} / {selectedEvent.capacity ?? 100}
                                </span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                                <div
                                    className="h-full rounded-full bg-[#7B1E1E]"
                                    style={{
                                        width: `${
                                            selectedEvent.capacity > 0 
                                                ? Math.min(100, Math.round(((selectedEvent.attendees ?? 0) / selectedEvent.capacity) * 100))
                                                : 0
                                        }%`
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center border-t pt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    closeDetailsModal();
                                    openDeleteModal(selectedEvent);
                                }}
                                className="text-xs text-red-600 hover:text-red-800 font-semibold inline-flex items-center gap-1"
                            >
                                <TrashIcon className="h-4 w-4" /> Cancel/Delete Event
                            </button>

                            <div className="flex gap-2">
                                <SecondaryButton onClick={closeDetailsModal}>Close</SecondaryButton>
                                <PrimaryButton onClick={() => {
                                    closeDetailsModal();
                                    openEditModal(selectedEvent);
                                }}>
                                    Edit Event Settings
                                </PrimaryButton>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* 4. DELETE / CANCEL EVENT CONFIRMATION MODAL */}
            <Modal show={isDeleteModalOpen} onClose={closeDeleteModal}>
                {selectedEvent && (
                    <div className="p-6 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                        </div>

                        <h3 className="text-lg font-bold text-gray-900">Cancel or Delete Event?</h3>
                        <p className="mt-2 text-xs text-gray-500 max-w-sm mx-auto">
                            Are you sure you want to delete <strong className="text-gray-800">"{selectedEvent.name || selectedEvent.formation_name}"</strong>? This will remove the session from QR scanners and roster records.
                        </p>

                        <div className="mt-6 flex justify-center gap-3">
                            <SecondaryButton onClick={closeDeleteModal}>Keep Event</SecondaryButton>
                            <button
                                type="button"
                                onClick={handleDeleteEventConfirm}
                                className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition"
                            >
                                Confirm Delete
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}