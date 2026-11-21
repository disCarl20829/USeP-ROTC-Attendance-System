/** Label + input/select slot + error message, using the app's design classes. */
export default function FormField({ id, label, error, hint, children, className = '' }) {
    return (
        <div className={className}>
            {label && (
                <label htmlFor={id} className="label-text">
                    {label}
                </label>
            )}
            {children}
            {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}

/** <select> built from a list of {value, label} options. */
export function SelectField({ id, value, onChange, options, placeholder = 'Select…', disabled = false }) {
    return (
        <select
            id={id}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="input-field disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
        >
            <option value="">{placeholder}</option>
            {options.map((o) => (
                <option key={o.value} value={o.value}>
                    {o.label}
                </option>
            ))}
        </select>
    );
}

/** Lookup lists from the server -> {value, label} options. */
export const toOptions = {
    campuses: (list = []) => list.map((c) => ({ value: String(c.campus_id), label: c.campus_name })),
    courses: (list = [], campusId = '') =>
        list
            .filter((c) => !campusId || !c.campus_id || String(c.campus_id) === String(campusId))
            .map((c) => ({ value: String(c.course_id), label: c.course_name })),
    platoons: (list = []) => list.map((p) => ({ value: String(p.platoon_id), label: p.platoon_name })),
    specializations: (list = []) =>
        list.map((s) => ({ value: String(s.specialization_id), label: s.specialization_name })),
    roles: (list = []) => list.map((r) => ({ value: String(r.role_id), label: r.role_name })),
};
