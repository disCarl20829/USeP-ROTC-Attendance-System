import { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, useForm } from '@inertiajs/react';
import { PlusIcon, MagnifyingGlassIcon, EllipsisVerticalIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

export default function Cadets({ cadets = [], courses = [], campuses = [], platoons = [], roles = [] }) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCadetId, setEditingCadetId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('All Courses');
    const [selectedYear, setSelectedYear] = useState('All Years');

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
    });

    const openAddModal = () => {
        addForm.reset();
        addForm.clearErrors();
        setIsAddModalOpen(true);
    };

    const closeAddModal = () => {
        setIsAddModalOpen(false);
        addForm.reset();
    };

    const openEditModal = (cadet) => {
        setEditingCadetId(cadet.id);
        editForm.setData({
            first_name: cadet.firstName || '',
            last_name: cadet.lastName || '',
            student_id_number: cadet.idNumber || '',
            email: cadet.email || '',
            course_id: cadet.course_id || '',
            campus_id: cadet.campus_id || '',
            platoon_id: cadet.platoon_id || '',
            role_id: cadet.role_id || '',
        });
        editForm.clearErrors();
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingCadetId(null);
        editForm.reset();
    };

    const handleAddCadetSubmit = (e) => {
        e.preventDefault();
        addForm.post(route('cadets.store'), {
            onSuccess: () => closeAddModal(),
        });
    };

    const handleEditCadetSubmit = (e) => {
        e.preventDefault();
        editForm.put(route('cadets.update', editingCadetId), {
            onSuccess: () => closeEditModal(),
        });
    };

    const filteredCadets = useMemo(() => {
        return cadets.filter((cadet) => {
            const matchesSearch = 
                cadet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                cadet.idNumber.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesCourse = 
                selectedCourse === 'All Courses' || cadet.course === selectedCourse;

            const matchesYear = 
                selectedYear === 'All Years' || cadet.year === selectedYear;

            return matchesSearch && matchesCourse && matchesYear;
        });
    }, [cadets, searchQuery, selectedCourse, selectedYear]);

    return (
        <AuthenticatedLayout header="Cadets">
            <Head title="Cadets" />

            {/* Header actions */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Cadet Management</h2>
                    <p className="text-sm text-gray-500">Manage all ROTC cadets and their information</p>
                </div>
                <button onClick={openAddModal} className="btn-primary flex items-center">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Add Cadet
                </button>
            </div>

            {/* Filters */}
            <div className="card mb-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search cadets by name or ID..."
                            className="input-field w-full pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3">
                        <select 
                            className="input-field w-auto"
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
                            className="input-field w-auto"
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

            {/* Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="table-header">Cadet</th>
                                <th className="table-header">ID Number</th>
                                <th className="table-header">Course</th>
                                <th className="table-header">Year</th>
                                <th className="table-header">Status</th>
                                <th className="table-header">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredCadets.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-6 text-center text-sm text-gray-500">
                                        No cadets found.
                                    </td>
                                </tr>
                            ) : (
                                filteredCadets.map((cadet) => (
                                    <tr key={cadet.id} className="hover:bg-gray-50">
                                        <td className="table-cell">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7B1E1E]/10 text-sm font-bold text-[#7B1E1E]">
                                                    {cadet.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <span className="font-medium text-gray-900">{cadet.name}</span>
                                            </div>
                                        </td>
                                        <td className="table-cell text-gray-500">{cadet.idNumber}</td>
                                        <td className="table-cell">{cadet.course}</td>
                                        <td className="table-cell">{cadet.year}</td>
                                        <td className="table-cell">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                    cadet.status === 'active'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}
                                            >
                                                {cadet.status.charAt(0).toUpperCase() + cadet.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="table-cell">
                                            <button
                                                onClick={() => openEditModal(cadet)}
                                                className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-900 flex items-center gap-1 text-xs font-medium"
                                                title="Edit Cadet"
                                            >
                                                <PencilSquareIcon className="h-4 w-4" />
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Cadet Modal */}
            <Modal show={isAddModalOpen} onClose={closeAddModal}>
                <form onSubmit={handleAddCadetSubmit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">Add New Cadet</h2>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="add_first_name" value="First Name" />
                            <TextInput
                                id="add_first_name"
                                type="text"
                                className="mt-1 block w-full"
                                value={addForm.data.first_name}
                                onChange={(e) => addForm.setData('first_name', e.target.value)}
                                required
                            />
                            <InputError message={addForm.errors.first_name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="add_last_name" value="Last Name" />
                            <TextInput
                                id="add_last_name"
                                type="text"
                                className="mt-1 block w-full"
                                value={addForm.data.last_name}
                                onChange={(e) => addForm.setData('last_name', e.target.value)}
                                required
                            />
                            <InputError message={addForm.errors.last_name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="add_student_id_number" value="Student ID Number" />
                            <TextInput
                                id="add_student_id_number"
                                type="text"
                                className="mt-1 block w-full"
                                value={addForm.data.student_id_number}
                                onChange={(e) => addForm.setData('student_id_number', e.target.value)}
                                required
                            />
                            <InputError message={addForm.errors.student_id_number} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="add_email" value="Email Address (Optional)" />
                            <TextInput
                                id="add_email"
                                type="email"
                                className="mt-1 block w-full"
                                value={addForm.data.email}
                                onChange={(e) => addForm.setData('email', e.target.value)}
                            />
                            <InputError message={addForm.errors.email} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="add_course_id" value="Course" />
                            <select
                                id="add_course_id"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                            <InputError message={addForm.errors.course_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="add_campus_id" value="Campus" />
                            <select
                                id="add_campus_id"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                            <InputError message={addForm.errors.campus_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="add_platoon_id" value="Platoon" />
                            <select
                                id="add_platoon_id"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                            <InputError message={addForm.errors.platoon_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="add_role_id" value="Role" />
                            <select
                                id="add_role_id"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                            <InputError message={addForm.errors.role_id} className="mt-2" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={closeAddModal}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={addForm.processing}>Save Cadet</PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Edit Cadet Modal */}
            <Modal show={isEditModalOpen} onClose={closeEditModal}>
                <form onSubmit={handleEditCadetSubmit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">Edit Cadet Details</h2>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="edit_first_name" value="First Name" />
                            <TextInput
                                id="edit_first_name"
                                type="text"
                                className="mt-1 block w-full"
                                value={editForm.data.first_name}
                                onChange={(e) => editForm.setData('first_name', e.target.value)}
                                required
                            />
                            <InputError message={editForm.errors.first_name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_last_name" value="Last Name" />
                            <TextInput
                                id="edit_last_name"
                                type="text"
                                className="mt-1 block w-full"
                                value={editForm.data.last_name}
                                onChange={(e) => editForm.setData('last_name', e.target.value)}
                                required
                            />
                            <InputError message={editForm.errors.last_name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_student_id_number" value="Student ID Number" />
                            <TextInput
                                id="edit_student_id_number"
                                type="text"
                                className="mt-1 block w-full"
                                value={editForm.data.student_id_number}
                                onChange={(e) => editForm.setData('student_id_number', e.target.value)}
                                required
                            />
                            <InputError message={editForm.errors.student_id_number} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_email" value="Email Address" />
                            <TextInput
                                id="edit_email"
                                type="email"
                                className="mt-1 block w-full"
                                value={editForm.data.email}
                                onChange={(e) => editForm.setData('email', e.target.value)}
                            />
                            <InputError message={editForm.errors.email} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_course_id" value="Course" />
                            <select
                                id="edit_course_id"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                            <InputError message={editForm.errors.course_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_campus_id" value="Campus" />
                            <select
                                id="edit_campus_id"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                            <InputError message={editForm.errors.campus_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_platoon_id" value="Platoon" />
                            <select
                                id="edit_platoon_id"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                            <InputError message={editForm.errors.platoon_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_role_id" value="Role" />
                            <select
                                id="edit_role_id"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={editForm.data.role_id}
                                onChange={(e) => editForm.setData('role_id', e.target.value)}
                            >
                                <option value="">Select Role</option>
                                {roles.map((r) => (
                                    <option key={r.role_id || r.id} value={r.role_id || r.id}>
                                        {r.role_name || r.name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={editForm.errors.role_id} className="mt-2" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={closeEditModal}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={editForm.processing}>Update Cadet</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}