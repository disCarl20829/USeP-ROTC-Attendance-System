const STYLES = {
    present: 'bg-emerald-100 text-emerald-800',
    late: 'bg-amber-100 text-amber-800',
    excused: 'bg-sky-100 text-sky-800',
    absent: 'bg-rose-100 text-rose-800',
    pending: 'bg-gray-100 text-gray-600',
};

export default function StatusBadge({ status }) {
    const key = String(status || 'pending').toLowerCase();
    return (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STYLES[key] ?? STYLES.pending}`}>
            {key === 'pending' ? 'No record' : key}
        </span>
    );
}
