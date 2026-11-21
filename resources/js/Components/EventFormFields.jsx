import FormField from '@/Components/FormField';

const SESSIONS = [
    { key: 'morning', label: 'Morning session' },
    { key: 'afternoon', label: 'Afternoon session' },
];

/**
 * Shared fields for the create / edit event forms.
 * Whole day = morning + afternoon sessions (2 sheet columns). Half day = one session.
 */
export default function EventFormFields({ form, prefix }) {
    const { data, setData, errors } = form;
    const isWholeDay = data.formation_type === 'whole_day';
    const shown = isWholeDay ? SESSIONS : SESSIONS.filter((s) => s.key === data.half_session);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField id={`${prefix}_formation_name`} label="Event name" error={errors.formation_name} className="sm:col-span-2">
                    <input
                        id={`${prefix}_formation_name`}
                        value={data.formation_name}
                        onChange={(e) => setData('formation_name', e.target.value)}
                        className="input-field"
                        placeholder="e.g. Regular Formation"
                        required
                    />
                </FormField>
                <FormField id={`${prefix}_formation_date`} label="Date" error={errors.formation_date}>
                    <input
                        id={`${prefix}_formation_date`}
                        type="date"
                        value={data.formation_date}
                        onChange={(e) => setData('formation_date', e.target.value)}
                        className="input-field"
                        required
                    />
                </FormField>
                <FormField id={`${prefix}_location`} label="Location" error={errors.location}>
                    <input
                        id={`${prefix}_location`}
                        value={data.location}
                        onChange={(e) => setData('location', e.target.value)}
                        className="input-field"
                        placeholder="e.g. PECC Gym"
                    />
                </FormField>
                <FormField id={`${prefix}_formation_type`} label="Length" error={errors.formation_type}>
                    <select
                        id={`${prefix}_formation_type`}
                        value={data.formation_type}
                        onChange={(e) => setData('formation_type', e.target.value)}
                        className="input-field"
                    >
                        <option value="half_day">Half day (1 session)</option>
                        <option value="whole_day">Whole day (morning + afternoon)</option>
                    </select>
                </FormField>
                {!isWholeDay && (
                    <FormField id={`${prefix}_half_session`} label="Session" error={errors.half_session}>
                        <select
                            id={`${prefix}_half_session`}
                            value={data.half_session}
                            onChange={(e) => setData('half_session', e.target.value)}
                            className="input-field"
                        >
                            <option value="morning">Morning</option>
                            <option value="afternoon">Afternoon</option>
                        </select>
                    </FormField>
                )}
            </div>

            {shown.map((s) => (
                <fieldset key={s.key} className="rounded-xl border border-gray-200 p-4">
                    <legend className="px-1 text-sm font-semibold text-gray-700">{s.label}</legend>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            ['start', 'Start'],
                            ['late', 'Late after'],
                            ['end', 'End'],
                        ].map(([part, label]) => {
                            const key = `${s.key}_${part}`;
                            return (
                                <FormField key={key} id={`${prefix}_${key}`} label={label} error={errors[key]}>
                                    <input
                                        id={`${prefix}_${key}`}
                                        type="time"
                                        value={data[key]}
                                        onChange={(e) => setData(key, e.target.value)}
                                        className="input-field px-2"
                                        required
                                    />
                                </FormField>
                            );
                        })}
                    </div>
                </fieldset>
            ))}
            <p className="text-xs text-gray-500">
                Scans after "Late after" are marked Late. Cadets not scanned by "End" are marked Absent automatically.
            </p>
        </div>
    );
}

/** Default form values. `defaults` come from Settings (admin default times). */
export function emptyEvent(defaults = {}) {
    return {
        id: '',
        formation_name: '',
        formation_date: '',
        formation_type: 'half_day',
        half_session: 'morning',
        location: '',
        morning_start: defaults.start_time ?? '06:30',
        morning_late: defaults.late_time ?? '07:00',
        morning_end: '12:00',
        afternoon_start: '13:00',
        afternoon_late: '13:15',
        afternoon_end: defaults.end_time ?? '17:00',
    };
}

/** Form values for an existing event (from EventController@index). */
export function eventToForm(event, defaults = {}) {
    const base = emptyEvent(defaults);
    const values = {
        ...base,
        id: event.id,
        formation_name: event.name ?? '',
        formation_date: event.rawDate ?? '',
        formation_type: event.formation_type ?? 'half_day',
        location: event.location ?? '',
    };
    (event.sessions ?? []).forEach((s) => {
        values[`${s.type}_start`] = s.start_time;
        values[`${s.type}_late`] = s.late_time;
        values[`${s.type}_end`] = s.end_time;
    });
    if (values.formation_type === 'half_day' && event.sessions?.length) {
        values.half_session = event.sessions[0].type;
    }
    return values;
}
