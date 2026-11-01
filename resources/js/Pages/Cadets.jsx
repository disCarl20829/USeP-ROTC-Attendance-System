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
    MagnifyingGlassIcon, 
    PencilSquareIcon, 
    UserMinusIcon, 
    UserPlusIcon, 
    XMarkIcon 
} from '@heroicons/react/24/outline';

export default function Cadets({ cadets = [], courses = [], campuses = [], platoons = [], roles = [] }) {
    // Modal & Action States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDropModalOpen, setIsDropModalOpen] = useState(false);
    const [isReEnrollModalOpen, setIsReEnrollModalOpen] = useState(false);

    const [editingCadetId, setEditingCadetId] = useState(null);
    const [selectedCadet, setSelectedCadet] = useState(null);

    // Filters State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('All Courses');
    const [selectedYear, setSelectedYear] = useState('All Years');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('All Statuses');

    // Add Cadet Form
    const addForm = useForm({
        first_name: '',
        last_name: '',
        student_id_number: '',
        email: '',
        course_id: '',
        campus_id: '',
        platoon_id: '',
        role_id: '',
        status: 'active',
    });

    // Edit Cadet Form
    const editForm = useForm({
        first_name: '',
        last_name: '',
        student_id_number: '',
        email: '',
        course_id: '',
        campus_id: '',
        platoon_id: '',
        role_id: '',
        status: 'active',
    });

    // Helper function for routes
    const getCadetUpdateUrl = (id) => {
        try {
            return route('cadets.update', id);
        } catch {
            return `/cadets/${id}`;
        }
    };

    const getCadetStoreUrl = () => {
        try {
            return route('cadets.store');
        } catch {
            return '/cadets';
        }
    };

    // Modal Handlers - Create
    const openAddModal = () => {
        addForm.reset();
        addForm.clearErrors();
        setIsAddModalOpen(true);
    };

    const closeAddModal = () => {
        setIsAddModalOpen(false);
        addForm.reset();
    };

    const handleAddCadetSubmit = (e) => {
        e.preventDefault();
        addForm.post(getCadetStoreUrl(), {
            onSuccess: () => closeAddModal(),
        });
    };

    // Modal Handlers - Edit
    const openEditModal = (cadet) => {
        const id = cadet.id || cadet.user_id;
        setEditingCadetId(id);
        editForm.setData({
            first_name: cadet.firstName || cadet.first_name || '',
            last_name: cadet.lastName || cadet.last_name || '',
            student_id_number: cadet.idNumber || cadet.student_id_number || '',
            email: cadet.email || '',
            course_id: cadet.course_id || '',
            campus_id: cadet.campus_id || '',
            platoon_id: cadet.platoon_id || '',
            role_id: cadet.role_id || '',
            status: cadet.status || 'active',
        });
        editForm.clearErrors();
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingCadetId(null);
        editForm.reset();
    };

    const handleEditCadetSubmit = (e) => {
        e.preventDefault();
        editForm.put(getCadetUpdateUrl(editingCadetId), {
            onSuccess: () => closeEditModal(),
        });
    };

    // Drop Cadet Handlers
    const openDropModal = (cadet) => {
        setSelectedCadet(cadet);
        setIsDropModalOpen(true);
    };

    const closeDropModal = () => {
        setIsDropModalOpen(false);
        setSelectedCadet(null);
    };

    const handleConfirmDrop = () => {
        if (!selectedCadet) return;
        const id = selectedCadet.id || selectedCadet.user_id;

        router.put(getCadetUpdateUrl(id), {
            status: 'dropped',
        }, {
            preserveScroll: true,
            onSuccess: () => closeDropModal(),
        });
    };

    // Re-enroll Cadet Handlers
    const openReEnrollModal = (cadet) => {
        setSelectedCadet(cadet);
        setIsReEnrollModalOpen(true);
    };

    const closeReEnrollModal = () => {
        setIsReEnrollModalOpen(false);
        setSelectedCadet(null);
    };

    const handleConfirmReEnroll = () => {
        if (!selectedCadet) return;
        const id = selectedCadet.id || selectedCadet.user_id;

        router.put(getCadetUpdateUrl(id), {
            status: 'active',
        }, {
            preserveScroll: true,
            onSuccess: () => closeReEnrollModal(),
        });
    };

    // Filter Logic
    const filteredCadets = useMemo(() => {
        return cadets.filter((cadet) => {
            const nameStr = cadet.name || `${cadet.first_name || ''} ${cadet.last_name || ''}`;
            const idStr = cadet.idNumber || cadet.student_id_number || '';

            const matchesSearch = 
                nameStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
                idStr.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesCourse = 
                selectedCourse === 'All Courses' || cadet.course === selectedCourse;

            const matchesYear = 
                selectedYear === 'All Years' || cadet.year === selectedYear;

            const matchesStatus = 
                selectedStatusFilter === 'All Statuses' ||
                (selectedStatusFilter === 'Active' && cadet.status !== 'dropped') ||
                (selectedStatusFilter === 'Dropped' && cadet.status === 'dropped');

            return matchesSearch && matchesCourse && matchesYear && matchesStatus;
        });
    }, [cadets, searchQuery, selectedCourse, selectedYear, selectedStatusFilter]);

    return (
        <AuthenticatedLayout header="Cadets">
            <Head title="Cadets" />

            {/* Header actions */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Cadet Management</h2>
                    <p className="text-sm text-gray-500">Manage ROTC cadets, view enrollment statuses, and update profiles</p>
                </div>
                <button onClick={openAddModal} className="btn-primary flex items-center justify-center gap-2">
                    <PlusIcon className="h-4 w-4" />
                    Add Cadet
                </button>
            </div>

            {/* Filters */}
            <div className="card mb-6 p-4 bg-white shadow rounded-lg border border-gray-200">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search cadets by name or ID..."
                            className="input-field w-full pl-9 text-xs"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <select 
                            className="input-field w-auto text-xs"
                            value={selectedStatusFilter}
                            onChange={(e) => setSelectedStatusFilter(e.target.value)}
                        >
                            <option value="All Statuses">All Statuses</option>
                            <option value="Active">Active Enrolled</option>
                            <option value="Dropped">Dropped Cadets</option>
                        </select>

                        <select 
                            className="input-field w-auto text-xs"
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                        >
                            <option value="All Courses">All Courses</option>
                            {courses.map((c) => (
                                <option key={c.course_id || c.id} value={c.course_name}>
                                    {c.course_name}
                                </option>
                            ))}
                        </select>

                        <select 
                            className="input-field w-auto text-xs"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                        >
                            <option value="All Years">All Years</option>
                            <option value="1st Year">1st Year</option>
                            <option value="2nd Year">2nd Year</option>
                            <option value="3rd Year">3rd Year</option>
                            <option value="4th Year">4th Year</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Cadets Table */}
            <div className="card overflow-hidden bg-white shadow rounded-lg border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="p-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cadet</th>
                                <th className="p-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID Number</th>
                                <th className="p-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Course</th>
                                <th className="p-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Year</th>
                                <th className="p-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                <th className="p-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredCadets.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-sm text-gray-500">
                                        No cadets found matching the selected criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredCadets.map((cadet) => {
                                    const isDropped = cadet.status === 'dropped';
                                    const cadetName = cadet.name || `${cadet.first_name || ''} ${cadet.last_name || ''}`;
                                    const idNumber = cadet.idNumber || cadet.student_id_number || 'N/A';
                                    const cadetId = cadet.id || cadet.user_id;

                                    return (
                                        <tr 
                                            key={cadetId} 
                                            className={`transition ${isDropped ? 'bg-gray-50/80 text-gray-400' : 'hover:bg-gray-50'}`}
                                        >
                                            <td className="p-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                                                        isDropped ? 'bg-gray-200 text-gray-500' : 'bg-[#7B1E1E]/10 text-[#7B1E1E]'
                                                    }`}>
                                                        {cadetName.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                                                        <span className={`font-semibold text-sm ${isDropped ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                                            {cadetName}
                                                        </span>
                                                        {isDropped && (
                                                            <span className="inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                                                                DROPPED
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3.5 text-xs text-gray-500 font-mono">{idNumber}</td>
                                            <td className="p-3.5 text-xs text-gray-700">{cadet.course || 'N/A'}</td>
                                            <td className="p-3.5 text-xs text-gray-700">{cadet.year || 'N/A'}</td>
                                            <td className="p-3.5">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                        isDropped
                                                            ? 'bg-gray-200 text-gray-600'
                                                            : 'bg-emerald-100 text-emerald-800'
                                                    }`}
                                                >
                                                    {isDropped ? 'Dropped' : 'Active'}
                                                </span>
                                            </td>
                                            <td className="p-3.5 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {/* Edit Button */}
                                                    <button
                                                        onClick={() => openEditModal(cadet)}
                                                        className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50 flex items-center gap-1 text-xs font-medium transition"
                                                        title="Edit Cadet"
                                                    >
                                                        <PencilSquareIcon className="h-4 w-4" />
                                                        Edit
                                                    </button>

                                                    {/* Drop or Re-enroll Button */}
                                                    {isDropped ? (
                                                        <button
                                                            onClick={() => openReEnrollModal(cadet)}
                                                            className="rounded-lg px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1 text-xs font-semibold transition"
                                                            title="Re-enroll Cadet"
                                                        >
                                                            <UserPlusIcon className="h-3.5 w-3.5" />
                                                            Re-enroll
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => openDropModal(cadet)}
                                                            className="rounded-lg px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 flex items-center gap-1 text-xs font-semibold transition"
                                                            title="Drop Cadet"
                                                        >
                                                            <UserMinusIcon className="h-3.5 w-3.5" />
                                                            Drop
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Cadet Modal */}
            <Modal show={isAddModalOpen} onClose={closeAddModal}>
                <form onSubmit={handleAddCadetSubmit} className="p-6">
                    <div className="flex items-center justify-between border-b pb-3 mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Add New Cadet</h2>
                        <button type="button" onClick={closeAddModal} className="text-gray-400 hover:text-gray-600">
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="add_first_name" value="First Name" />
                            <TextInput
                                id="add_first_name"
                                type="text"
                                className="mt-1 block w-full text-sm"
                                value={addForm.data.first_name}
                                onChange={(e) => addForm.setData('first_name', e.target.value)}
                                required
                            />
                            <InputError message={addForm.errors.first_name} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="add_last_name" value="Last Name" />
                            <TextInput
                                id="add_last_name"
                                type="text"
                                className="mt-1 block w-full text-sm"
                                value={addForm.data.last_name}
                                onChange={(e) => addForm.setData('last_name', e.target.value)}
                                required
                            />
                            <InputError message={addForm.errors.last_name} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="add_student_id_number" value="Student ID Number" />
                            <TextInput
                                id="add_student_id_number"
                                type="text"
                                className="mt-1 block w-full text-sm"
                                value={addForm.data.student_id_number}
                                onChange={(e) => addForm.setData('student_id_number', e.target.value)}
                                required
                            />
                            <InputError message={addForm.errors.student_id_number} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="add_email" value="Email Address (Optional)" />
                            <TextInput
                                id="add_email"
                                type="email"
                                className="mt-1 block w-full text-sm"
                                value={addForm.data.email}
                                onChange={(e) => addForm.setData('email', e.target.value)}
                            />
                            <InputError message={addForm.errors.email} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="add_course_id" value="Course" />
                            <select
                                id="add_course_id"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={addForm.data.course_id}
                                onChange={(e) => addForm.setData('course_id', e.target.value)}
                            >
                                <option value="">Select Course</option>
                                {courses.map((c) => (
                                    <option key={c.course_id || c.id} value={c.course_id || c.id}>
                                        {c.course_name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={addForm.errors.course_id} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="add_campus_id" value="Campus" />
                            <select
                                id="add_campus_id"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={addForm.data.campus_id}
                                onChange={(e) => addForm.setData('campus_id', e.target.value)}
                            >
                                <option value="">Select Campus</option>
                                {campuses.map((c) => (
                                    <option key={c.campus_id || c.id} value={c.campus_id || c.id}>
                                        {c.campus_name || c.name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={addForm.errors.campus_id} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="add_platoon_id" value="Platoon" />
                            <select
                                id="add_platoon_id"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={addForm.data.platoon_id}
                                onChange={(e) => addForm.setData('platoon_id', e.target.value)}
                            >
                                <option value="">Select Platoon</option>
                                {platoons.map((p) => (
                                    <option key={p.platoon_id || p.id} value={p.platoon_id || p.id}>
                                        {p.platoon_name || p.name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={addForm.errors.platoon_id} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="add_role_id" value="Role" />
                            <select
                                id="add_role_id"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={addForm.data.role_id}
                                onChange={(e) => addForm.setData('role_id', e.target.value)}
                            >
                                <option value="">Default (Cadet)</option>
                                {roles.map((r) => (
                                    <option key={r.role_id || r.id} value={r.role_id || r.id}>
                                        {r.role_name || r.name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={addForm.errors.role_id} className="mt-1" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                        <SecondaryButton onClick={closeAddModal}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={addForm.processing}>Save Cadet</PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Edit Cadet Modal */}
            <Modal show={isEditModalOpen} onClose={closeEditModal}>
                <form onSubmit={handleEditCadetSubmit} className="p-6">
                    <div className="flex items-center justify-between border-b pb-3 mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Edit Cadet Details</h2>
                        <button type="button" onClick={closeEditModal} className="text-gray-400 hover:text-gray-600">
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="edit_first_name" value="First Name" />
                            <TextInput
                                id="edit_first_name"
                                type="text"
                                className="mt-1 block w-full text-sm"
                                value={editForm.data.first_name}
                                onChange={(e) => editForm.setData('first_name', e.target.value)}
                                required
                            />
                            <InputError message={editForm.errors.first_name} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_last_name" value="Last Name" />
                            <TextInput
                                id="edit_last_name"
                                type="text"
                                className="mt-1 block w-full text-sm"
                                value={editForm.data.last_name}
                                onChange={(e) => editForm.setData('last_name', e.target.value)}
                                required
                            />
                            <InputError message={editForm.errors.last_name} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_student_id_number" value="Student ID Number" />
                            <TextInput
                                id="edit_student_id_number"
                                type="text"
                                className="mt-1 block w-full text-sm"
                                value={editForm.data.student_id_number}
                                onChange={(e) => editForm.setData('student_id_number', e.target.value)}
                                required
                            />
                            <InputError message={editForm.errors.student_id_number} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_email" value="Email Address" />
                            <TextInput
                                id="edit_email"
                                type="email"
                                className="mt-1 block w-full text-sm"
                                value={editForm.data.email}
                                onChange={(e) => editForm.setData('email', e.target.value)}
                            />
                            <InputError message={editForm.errors.email} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_status" value="Enrollment Status" />
                            <select
                                id="edit_status"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={editForm.data.status}
                                onChange={(e) => editForm.setData('status', e.target.value)}
                            >
                                <option value="active">Active</option>
                                <option value="dropped">Dropped</option>
                            </select>
                            <InputError message={editForm.errors.status} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_course_id" value="Course" />
                            <select
                                id="edit_course_id"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={editForm.data.course_id}
                                onChange={(e) => editForm.setData('course_id', e.target.value)}
                            >
                                <option value="">Select Course</option>
                                {courses.map((c) => (
                                    <option key={c.course_id || c.id} value={c.course_id || c.id}>
                                        {c.course_name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={editForm.errors.course_id} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_campus_id" value="Campus" />
                            <select
                                id="edit_campus_id"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={editForm.data.campus_id}
                                onChange={(e) => editForm.setData('campus_id', e.target.value)}
                            >
                                <option value="">Select Campus</option>
                                {campuses.map((c) => (
                                    <option key={c.campus_id || c.id} value={c.campus_id || c.id}>
                                        {c.campus_name || c.name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={editForm.errors.campus_id} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_platoon_id" value="Platoon" />
                            <select
                                id="edit_platoon_id"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={editForm.data.platoon_id}
                                onChange={(e) => editForm.setData('platoon_id', e.target.value)}
                            >
                                <option value="">Select Platoon</option>
                                {platoons.map((p) => (
                                    <option key={p.platoon_id || p.id} value={p.platoon_id || p.id}>
                                        {p.platoon_name || p.name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={editForm.errors.platoon_id} className="mt-1" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                        <SecondaryButton onClick={closeEditModal}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={editForm.processing}>Update Cadet</PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Confirm Drop Cadet Modal */}
            <Modal show={isDropModalOpen} onClose={closeDropModal}>
                {selectedCadet && (
                    <div className="p-6 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
                            <UserMinusIcon className="h-8 w-8 text-rose-600" />
                        </div>

                        <h3 className="text-lg font-bold text-gray-900">Drop Cadet from ROTC?</h3>
                        <p className="mt-2 text-xs text-gray-600 max-w-sm mx-auto">
                            Are you sure you want to drop <strong className="text-gray-900">"{selectedCadet.name || `${selectedCadet.first_name} ${selectedCadet.last_name}`}"</strong> ({selectedCadet.idNumber || selectedCadet.student_id_number})?
                        </p>

                        <div className="mt-6 flex justify-center gap-3">
                            <SecondaryButton onClick={closeDropModal}>Keep Active</SecondaryButton>
                            <button
                                type="button"
                                onClick={handleConfirmDrop}
                                className="inline-flex items-center rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition"
                            >
                                Confirm Drop
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Confirm Re-enroll Cadet Modal */}
            <Modal show={isReEnrollModalOpen} onClose={closeReEnrollModal}>
                {selectedCadet && (
                    <div className="p-6 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                            <UserPlusIcon className="h-8 w-8 text-emerald-600" />
                        </div>

                        <h3 className="text-lg font-bold text-gray-900">Re-enroll Cadet?</h3>
                        <p className="mt-2 text-xs text-gray-600 max-w-sm mx-auto">
                            Re-enroll <strong className="text-gray-900">"{selectedCadet.name || `${selectedCadet.first_name} ${selectedCadet.last_name}`}"</strong> ({selectedCadet.idNumber || selectedCadet.student_id_number}) back into active ROTC status?
                        </p>

                        <div className="mt-6 flex justify-center gap-3">
                            <SecondaryButton onClick={closeReEnrollModal}>Cancel</SecondaryButton>
                            <button
                                type="button"
                                onClick={handleConfirmReEnroll}
                                className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
                            >
                                Confirm Re-enrollment
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}