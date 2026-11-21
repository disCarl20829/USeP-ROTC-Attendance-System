import { usePage } from '@inertiajs/react';

/** Shows flash status / success / error messages from the server. */
export default function StatusMessage({ status }) {
    const { flash = {} } = usePage().props;
    const success = flash.success;
    const error = flash.error;
    const info = status ?? flash.status;

    return (
        <>
            {success && <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700">{success}</div>}
            {info && <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm font-medium text-blue-700">{info}</div>}
            {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>}
        </>
    );
}
