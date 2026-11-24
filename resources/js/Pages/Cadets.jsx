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

export default function Cadets({ cadets = [], archived = [], courses = [], campuses = [], platoons = [], platoonUnits = [], specializations = [], roles = [], can = {} }) {
    // Archive (admin only): selection, bulk confirmation, archived list
    const [selected, setSelected] = useState([]);
    const [showArchived, setShowArchived] = useState(false);
    const [archiveTargets, setArchiveTargets] = useState(null); // array of {id, name}
    const [archiveConfirm, setArchiveConfirm] = useState('');
    const [archiving, setArchiving] = useState(false);

    const toggleSelected = (id) =>
        setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    const openArchive = (targets) => {
        setArchiveTargets(targets);
        setArchiveConfirm('');
    };

    const archiveWord = archiveTargets ? `ARCHIVE ${archiveTargets.length}` : '';

    const submitArchive = () => {
        if (!archiveTargets) return;
        setArchiving(true);
        const done = {
            preserveScroll: true,
            onSuccess: () => {
                setArchiveTargets(null);
                setSelected([]);
            },
            onFinish: () => setArchiving(false),
        };
        if (archiveTargets.length === 1) {
            router.delete(route('cadets.destroy', archiveTargets[0].id), done);
        } else {
            router.post(route('cadets.archive'), { ids: archiveTargets.map((t) => t.id), confirm: archiveConfirm }, done);
        }
    };

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
    const [selectedPlatoon, setSelectedPlatoon] = useState('All Platoons');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('All Statuses');

    // Add Cadet Form
    const addForm = useForm({
        first_name: '',
        middle_name: '',
        last_name: '',
        student_id: '',
        email: '',
        course_id: '',
        campus_id: '',
        platoon_id: '',
        platoon_unit_id: '',
        specialization_id: '',
        role_id: '',
        status: 'active',
    });

    // Edit Cadet Form
    const editForm = useForm({
        first_name: '',
        middle_name: '',
        last_name: '',
        student_id: '',
        email: '',
        course_id: '',
        campus_id: '',
        platoon_id: '',
        platoon_unit_id: '',
        specialization_id: '',
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
        const id = cadet.id;
        setEditingCadetId(id);
        editForm.setData({
            first_name: cadet.firstName || cadet.first_name || '',
            middle_name: cadet.middleName || cadet.middle_name || '',
            last_name: cadet.lastName || cadet.last_name || '',
            student_id: cadet.idNumber || cadet.student_id || '',
            email: cadet.email || '',
            course_id: cadet.course_id ? String(cadet.course_id) : '',
            campus_id: cadet.campus_id ? String(cadet.campus_id) : '',
            platoon_id: cadet.platoon_id ? String(cadet.platoon_id) : '',
            platoon_unit_id: cadet.platoon_unit_id ? String(cadet.platoon_unit_id) : '',
            specialization_id: cadet.specialization_id ? String(cadet.specialization_id) : '',
            role_id: cadet.role_id ? String(cadet.role_id) : '',
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
        const id = selectedCadet.id;

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
        const id = selectedCadet.id;

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
            const idStr = cadet.idNumber || cadet.student_id || '';

            const matchesSearch = 
                nameStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
                idStr.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesCourse = 
                selectedCourse === 'All Courses' || cadet.course === selectedCourse;

            const matchesPlatoon =
                selectedPlatoon === 'All Platoons' || cadet.platoon === selectedPlatoon;

            const matchesStatus = 
                selectedStatusFilter === 'All Statuses' ||
                (selectedStatusFilter === 'Active' && cadet.status !== 'dropped') ||
                (selectedStatusFilter === 'Dropped' && cadet.status === 'dropped');

            return matchesSearch && matchesCourse && matchesPlatoon && matchesStatus;
        });
    }, [cadets, searchQuery, selectedCourse, selectedPlatoon, selectedStatusFilter]);

    return (
        <AuthenticatedLayout header="Cadets">
            <Head title="Cadets" />

            {/* Header actions */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Cadet Management</h2>
                    <p className="text-sm text-gray-500">Manage ROTC cadets, view enrollment statuses, and update profiles</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {can.delete && (
                        <button
                            type="button"
                            onClick={() => setShowArchived((v) => !v)}
                            className="btn-secondary px-4 py-2.5"
                        >
                            {showArchived ? 'Back to active cadets' : `Archived (${archived.length})`}
                        </button>
                    )}
                    <button onClick={openAddModal} className="btn-primary flex items-center justify-center gap-2">
                        <PlusIcon className="h-4 w-4" />
                        Add Cadet
                    </button>
                </div>
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
                            value={selectedPlatoon}
                            onChange={(e) => setSelectedPlatoon(e.target.value)}
                        >
                            <option value="All Platoons">All Platoons</option>
                            {[...new Set(cadets.map((c) => c.platoon))].sort().map((label) => (
                                <option key={label} value={label}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {showArchived && (
                <div className="card mb-6 overflow-hidden">
                    <div className="border-b border-gray-100 p-4">
                        <h3 className="font-semibold text-gray-900">Archived profiles</h3>
                        <p className="text-xs text-gray-500">Hidden from attendance and reports. Restore within 30 days; after that they are deleted.</p>
                    </div>
                    {archived.length === 0 ? (
                        <p className="p-6 text-center text-sm text-gray-400">Nothing archived.</p>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {archived.map((a) => (
                                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                                    <div>
                                        <p className="font-semibold text-gray-900">{a.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {a.student_id} · {a.role} · archived {a.archived_at} · restorable until {a.restorable_until}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => router.post(route('cadets.restore', a.id), {}, { preserveScroll: true })}
                                        className="btn-secondary px-3 py-1.5 text-xs"
                                    >
                                        Restore
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {can.delete && selected.length > 0 && !showArchived && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm">
                    <span className="font-semibold text-red-800">{selected.length} selected</span>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setSelected([])} className="btn-secondary px-3 py-1.5 text-xs">
                            Clear
                        </button>
                        <button
                            type="button"
                            onClick={() => openArchive(cadets.filter((c) => selected.includes(c.id)).map((c) => ({ id: c.id, name: c.name })))}
                            className="rounded-xl bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800"
                        >
                            Archive selected
                        </button>
                    </div>
                </div>
            )}

            {/* Cadets Table */}
            <div className="card overflow-hidden bg-white shadow rounded-lg border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                {can.delete && (
                                    <th className="w-10 p-3.5">
                                        <input
                                            type="checkbox"
                                            aria-label="Select all shown"
                                            checked={filteredCadets.length > 0 && filteredCadets.every((c) => selected.includes(c.id))}
                                            onChange={(e) =>
                                                setSelected(e.target.checked ? filteredCadets.map((c) => c.id) : [])
                                            }
                                            className="h-4 w-4 rounded border-gray-300 text-[#7B1E1E] focus:ring-[#7B1E1E]"
                                        />
                                    </th>
                                )}
                                <th className="p-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cadet</th>
                                <th className="p-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID Number</th>
                                <th className="p-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Course</th>
                                <th className="p-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Platoon / Role</th>
                                <th className="p-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                <th className="p-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredCadets.length === 0 ? (
                                <tr>
                                    <td colSpan={can.delete ? 7 : 6} className="py-8 text-center text-sm text-gray-500">
                                        No cadets found matching the selected criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredCadets.map((cadet) => {
                                    const isDropped = cadet.status === 'dropped';
                                    const cadetName = cadet.name || `${cadet.first_name || ''} ${cadet.last_name || ''}`;
                                    const idNumber = cadet.idNumber || cadet.student_id || 'N/A';
                                    const cadetId = cadet.id;

                                    return (
                                        <tr 
                                            key={cadetId} 
                                            className={`transition ${isDropped ? 'bg-gray-50/80 text-gray-400' : 'hover:bg-gray-50'}`}
                                        >
                                            {can.delete && (
                                                <td className="p-3.5">
                                                    <input
                                                        type="checkbox"
                                                        aria-label={`Select ${cadetName}`}
                                                        checked={selected.includes(cadetId)}
                                                        onChange={() => toggleSelected(cadetId)}
                                                        className="h-4 w-4 rounded border-gray-300 text-[#7B1E1E] focus:ring-[#7B1E1E]"
                                                    />
                                                </td>
                                            )}
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
                                            <td className="p-3.5 text-xs text-gray-700">
                                                {cadet.platoon}
                                                <span className="block text-[11px] text-gray-400">
                                                    {cadet.role} · {cadet.specialization}
                                                    {!cadet.has_login && ' · no account yet'}
                                                </span>
                                            </td>
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
                                                    {can.delete && cadet.role?.toLowerCase() !== 'admin' && (
                                                        <button
                                                            onClick={() => openArchive([{ id: cadetId, name: cadetName }])}
                                                            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-100"
                                                            title="Archive (restorable for 30 days)"
                                                        >
                                                            Archive
                                                        </button>
                                                    )}

                                                    {/* Edit Button */}
                                                    <button
                                                        onClick={() => openEditModal(cadet)}
                                                        className="rounded-lg p-1.5 text-rotc-maroon hover:bg-rotc-maroon/5 flex items-center gap-1 text-xs font-medium transition"
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

            {/* Archive confirmation */}
            <Modal show={!!archiveTargets} onClose={() => setArchiveTargets(null)}>
                {archiveTargets && (
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-900">
                            Archive {archiveTargets.length === 1 ? archiveTargets[0].name : `${archiveTargets.length} profiles`}?
                        </h3>
                        <p className="mt-2 text-sm text-gray-600">
                            They disappear from attendance, the scanner and reports, and can&apos;t log in. You can restore them
                            for 30 days; after that they are deleted for good (login accounts after one year).
                        </p>
                        {archiveTargets.length > 1 && (
                            <div className="mt-4">
                                <label className="label-text" htmlFor="archive_confirm">
                                    Type <code className="font-mono text-red-700">{archiveWord}</code> to confirm
                                </label>
                                <input
                                    id="archive_confirm"
                                    value={archiveConfirm}
                                    onChange={(e) => setArchiveConfirm(e.target.value)}
                                    className="input-field font-mono"
                                    autoFocus
                                />
                            </div>
                        )}
                        <div className="mt-6 flex justify-end gap-3">
                            <SecondaryButton onClick={() => setArchiveTargets(null)}>Cancel</SecondaryButton>
                            <button
                                type="button"
                                disabled={archiving || (archiveTargets.length > 1 && archiveConfirm !== archiveWord)}
                                onClick={submitArchive}
                                className="rounded-xl bg-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-40"
                            >
                                {archiving ? 'Archiving…' : 'Archive'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Add Cadet Modal */}
            <Modal show={isAddModalOpen} onClose={closeAddModal}>
                <form onSubmit={handleAddCadetSubmit} className="p-6">
                    <div className="flex items-center justify-between border-b pb-3 mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Add Member</h2>
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
                            <InputLabel htmlFor="add_middle_name" value="Middle Name (optional)" />
                            <TextInput
                                id="add_middle_name"
                                type="text"
                                className="mt-1 block w-full text-sm"
                                value={addForm.data.middle_name}
                                onChange={(e) => addForm.setData('middle_name', e.target.value)}
                            />
                            <InputError message={addForm.errors.middle_name} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="add_student_id" value="Student ID Number" />
                            <TextInput
                                id="add_student_id"
                                type="text"
                                className="mt-1 block w-full text-sm"
                                value={addForm.data.student_id}
                                onChange={(e) => addForm.setData('student_id', e.target.value)}
                                required
                            />
                            <InputError message={addForm.errors.student_id} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="add_email" value="USeP Email (used to link their account)" />
                            <TextInput
                                id="add_email"
                                type="email"
                                className="mt-1 block w-full text-sm"
                                value={addForm.data.email}
                                onChange={(e) => addForm.setData('email', e.target.value)}
                                placeholder="name@usep.edu.ph"
                                required
                            />
                            <InputError message={addForm.errors.email} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="add_course_id" value="Course" />
                            <select
                                id="add_course_id"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-rotc-maroon focus:ring-rotc-maroon disabled:bg-gray-100"
                                value={addForm.data.course_id}
                                onChange={(e) => addForm.setData('course_id', e.target.value)}
                            >
                                <option value="">Select Course</option>
                                {courses.filter((c) => !addForm.data.campus_id || !c.campus_id || String(c.campus_id) === String(addForm.data.campus_id)).map((x) => (
                                    <option key={x.course_id} value={x.course_id}>
                                        {x.course_name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={addForm.errors.course_id} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="add_campus_id" value="Campus" />
                            <select
                                id="add_campus_id"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-rotc-maroon focus:ring-rotc-maroon disabled:bg-gray-100"
                                value={addForm.data.campus_id}
                                onChange={(e) => addForm.setData('campus_id', e.target.value)}
                            >
                                <option value="">Select Campus</option>
                                {campuses.map((x) => (
                                    <option key={x.campus_id} value={x.campus_id}>
                                        {x.campus_name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={addForm.errors.campus_id} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="add_platoon_id" value="Platoon" />
                            <select
                                id="add_platoon_id"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-rotc-maroon focus:ring-rotc-maroon disabled:bg-gray-100"
                                value={addForm.data.platoon_id}
                                onChange={(e) => addForm.setData((d) => ({ ...d, platoon_id: e.target.value, platoon_unit_id: '' }))}
                                disabled={!can.assign}
                            >
                                <option value="">Unspecified</option>
                                {platoons.map((x) => (
                                    <option key={x.platoon_id} value={x.platoon_id}>
                                        {x.platoon_name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={addForm.errors.platoon_id} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="add_platoon_unit_id" value="Platoon Number" />
                            <select
                                id="add_platoon_unit_id"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-rotc-maroon focus:ring-rotc-maroon disabled:bg-gray-100"
                                value={addForm.data.platoon_unit_id}
                                onChange={(e) => addForm.setData('platoon_unit_id', e.target.value)}
                                disabled={!can.assign || !addForm.data.platoon_id}
                            >
                                <option value="">{addForm.data.platoon_id ? 'Select number' : 'Select a platoon first'}</option>
                                {platoonUnits
                                    .filter((u) => String(u.platoon_id) === String(addForm.data.platoon_id))
                                    .map((u) => (
                                        <option key={u.unit_id} value={u.unit_id}>
                                            {u.label}
                                        </option>
                                    ))}
                            </select>
                            <InputError message={addForm.errors.platoon_unit_id} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="add_specialization_id" value="Specialization" />
                            <select
                                id="add_specialization_id"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-rotc-maroon focus:ring-rotc-maroon disabled:bg-gray-100"
                                value={addForm.data.specialization_id}
                                onChange={(e) => addForm.setData('specialization_id', e.target.value)}
                                disabled={!can.assign}
                            >
                                <option value="">Unspecified</option>
                                {specializations.map((x) => (
                                    <option key={x.specialization_id} value={x.specialization_id}>
                                        {x.specialization_name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={addForm.errors.specialization_id} className="mt-1" />
                        </div>

                        {can.roles && (
                        <div>
                            <InputLabel htmlFor="add_role_id" value="Role" />
                            <select
                                id="add_role_id"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-rotc-maroon focus:ring-rotc-maroon disabled:bg-gray-100"
                                value={addForm.data.role_id}
                                onChange={(e) => addForm.setData('role_id', e.target.value)}
                            >
                                <option value="">Default (Cadet)</option>
                                {roles.map((x) => (
                                    <option key={x.role_id} value={x.role_id}>
                                        {x.role_name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={addForm.errors.role_id} className="mt-1" />
                        </div>
                        )}
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
                            <InputLabel htmlFor="edit_middle_name" value="Middle Name (optional)" />
                            <TextInput
                                id="edit_middle_name"
                                type="text"
                                className="mt-1 block w-full text-sm"
                                value={editForm.data.middle_name}
                                onChange={(e) => editForm.setData('middle_name', e.target.value)}
                            />
                            <InputError message={editForm.errors.middle_name} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_student_id" value="Student ID Number" />
                            <TextInput
                                id="edit_student_id"
                                type="text"
                                className="mt-1 block w-full text-sm"
                                value={editForm.data.student_id}
                                onChange={(e) => editForm.setData('student_id', e.target.value)}
                                required
                            />
                            <InputError message={editForm.errors.student_id} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_email" value="Email Address" />
                            <TextInput
                                id="edit_email"
                                type="email"
                                className="mt-1 block w-full text-sm"
                                value={editForm.data.email}
                                disabled
                                onChange={() => {}}
                            />
                            <InputError message={editForm.errors.email} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_status" value="Enrollment Status" />
                            <select
                                id="edit_status"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-rotc-maroon focus:ring-rotc-maroon"
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
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-rotc-maroon focus:ring-rotc-maroon disabled:bg-gray-100"
                                value={editForm.data.course_id}
                                onChange={(e) => editForm.setData('course_id', e.target.value)}
                            >
                                <option value="">Select Course</option>
                                {courses.filter((c) => !editForm.data.campus_id || !c.campus_id || String(c.campus_id) === String(editForm.data.campus_id)).map((x) => (
                                    <option key={x.course_id} value={x.course_id}>
                                        {x.course_name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={editForm.errors.course_id} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_campus_id" value="Campus" />
                            <select
                                id="edit_campus_id"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-rotc-maroon focus:ring-rotc-maroon disabled:bg-gray-100"
                                value={editForm.data.campus_id}
                                onChange={(e) => editForm.setData('campus_id', e.target.value)}
                            >
                                <option value="">Select Campus</option>
                                {campuses.map((x) => (
                                    <option key={x.campus_id} value={x.campus_id}>
                                        {x.campus_name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={editForm.errors.campus_id} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_platoon_id" value="Platoon" />
                            <select
                                id="edit_platoon_id"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-rotc-maroon focus:ring-rotc-maroon disabled:bg-gray-100"
                                value={editForm.data.platoon_id}
                                onChange={(e) => editForm.setData((d) => ({ ...d, platoon_id: e.target.value, platoon_unit_id: '' }))}
                                disabled={!can.assign}
                            >
                                <option value="">Unspecified</option>
                                {platoons.map((x) => (
                                    <option key={x.platoon_id} value={x.platoon_id}>
                                        {x.platoon_name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={editForm.errors.platoon_id} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="edit_platoon_unit_id" value="Platoon Number" />
                            <select
                                id="edit_platoon_unit_id"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-rotc-maroon focus:ring-rotc-maroon disabled:bg-gray-100"
                                value={editForm.data.platoon_unit_id}
                                onChange={(e) => editForm.setData('platoon_unit_id', e.target.value)}
                                disabled={!can.assign || !editForm.data.platoon_id}
                            >
                                <option value="">{editForm.data.platoon_id ? 'Select number' : 'Select a platoon first'}</option>
                                {platoonUnits
                                    .filter((u) => String(u.platoon_id) === String(editForm.data.platoon_id))
                                    .map((u) => (
                                        <option key={u.unit_id} value={u.unit_id}>
                                            {u.label}
                                        </option>
                                    ))}
                            </select>
                            <InputError message={editForm.errors.platoon_unit_id} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_specialization_id" value="Specialization" />
                            <select
                                id="edit_specialization_id"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-rotc-maroon focus:ring-rotc-maroon disabled:bg-gray-100"
                                value={editForm.data.specialization_id}
                                onChange={(e) => editForm.setData('specialization_id', e.target.value)}
                                disabled={!can.assign}
                            >
                                <option value="">Unspecified</option>
                                {specializations.map((x) => (
                                    <option key={x.specialization_id} value={x.specialization_id}>
                                        {x.specialization_name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={editForm.errors.specialization_id} className="mt-1" />
                        </div>
                        {can.roles && (
                        <div>
                            <InputLabel htmlFor="edit_role_id" value="Role" />
                            <select
                                id="edit_role_id"
                                className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-rotc-maroon focus:ring-rotc-maroon disabled:bg-gray-100"
                                value={editForm.data.role_id}
                                onChange={(e) => editForm.setData('role_id', e.target.value)}
                            >
                                <option value="">Keep current role</option>
                                {roles.map((x) => (
                                    <option key={x.role_id} value={x.role_id}>
                                        {x.role_name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={editForm.errors.role_id} className="mt-1" />
                        </div>
                        )}
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
                            Are you sure you want to drop <strong className="text-gray-900">"{selectedCadet.name || `${selectedCadet.first_name} ${selectedCadet.last_name}`}"</strong> ({selectedCadet.idNumber || selectedCadet.student_id})?
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
                            Re-enroll <strong className="text-gray-900">"{selectedCadet.name || `${selectedCadet.first_name} ${selectedCadet.last_name}`}"</strong> ({selectedCadet.idNumber || selectedCadet.student_id}) back into active ROTC status?
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