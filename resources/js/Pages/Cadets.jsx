import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';

const cadets = [
    { id: 1, name: 'Juan Dela Cruz', idNumber: '2021-0001', course: 'BSIT', year: '3rd Year', status: 'active' },
    { id: 2, name: 'Maria Santos', idNumber: '2021-0002', course: 'BSCS', year: '3rd Year', status: 'active' },
    { id: 3, name: 'Pedro Reyes', idNumber: '2021-0003', course: 'BSIT', year: '2nd Year', status: 'active' },
    { id: 4, name: 'Ana Garcia', idNumber: '2021-0004', course: 'BSIS', year: '4th Year', status: 'inactive' },
    { id: 5, name: 'Carlos Mendoza', idNumber: '2021-0005', course: 'BSIT', year: '1st Year', status: 'active' },
    { id: 6, name: 'Sofia Ramirez', idNumber: '2021-0006', course: 'BSCS', year: '2nd Year', status: 'active' },
    { id: 7, name: 'Miguel Torres', idNumber: '2021-0007', course: 'BSIT', year: '3rd Year', status: 'active' },
    { id: 8, name: 'Isabella Cruz', idNumber: '2021-0008', course: 'BSIS', year: '1st Year', status: 'active' },
];

export default function Cadets() {
    return (
        <AuthenticatedLayout header="Cadets">
            <Head title="Cadets" />

            {/* Header actions */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Cadet Management</h2>
                    <p className="text-sm text-gray-500">Manage all ROTC cadets and their information</p>
                </div>
                <button className="btn-primary">
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
                            className="input-field pl-9"
                        />
                    </div>
                    <div className="flex gap-3">
                        <select className="input-field w-auto">
                            <option>All Courses</option>
                            <option>BSIT</option>
                            <option>BSCS</option>
                            <option>BSIS</option>
                        </select>
                        <select className="input-field w-auto">
                            <option>All Years</option>
                            <option>1st Year</option>
                            <option>2nd Year</option>
                            <option>3rd Year</option>
                            <option>4th Year</option>
                        </select>
                        <button className="btn-secondary">
                            <FunnelIcon className="mr-2 h-4 w-4" />
                            Filter
                        </button>
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
                                <th className="table-header"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {cadets.map((cadet) => (
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
                                        <button className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                                            <EllipsisVerticalIcon className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="border-t border-gray-100 px-6 py-4">
                    <p className="text-sm text-gray-500">Showing {cadets.length} of 258 cadets</p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
