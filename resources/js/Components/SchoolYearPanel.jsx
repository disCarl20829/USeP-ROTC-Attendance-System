import { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import FormField from '@/Components/FormField';

const ACTION_LABELS = {
    'school_year.start': 'Started school year',
    'school_year.update': 'Edited school year',
    'school_year.backup': 'Downloaded backup',
    'school_year.close': 'Archived school year',
    'school_year.restore': 'Restored school year',
    'cadets.archive': 'Archived a profile',
    'cadets.archive_bulk': 'Archived profiles (bulk)',
    'cadets.restore': 'Restored a profile',
    purge: 'Deleted expired archives',
    'school_year.auto_start': 'School year started automatically',
    'platoon_unit.add': 'Added platoon number',
    'platoon_unit.remove': 'Removed platoon number',
};

function nextYearDefaults(active) {
    const y = active ? Number(active.enrollment_year) + 1 : new Date().getFullYear();
    return { name: `${y}-${y + 1}`, enrollment_year: String(y), starts_on: `${y}-08-01`, ends_on: `${y + 1}-05-31` };
}

function YearFields({ form, prefix }) {
    const f = (key, label, type = 'text', hint = null) => (
        <FormField id={`${prefix}_${key}`} label={label} error={form.errors[key]} hint={hint}>
            <input
                id={`${prefix}_${key}`}
                type={type}
                value={form.data[key]}
                onChange={(e) => form.setData(key, e.target.value)}
                className="input-field"
                required
            />
        </FormField>
    );
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {f('name', 'Name', 'text', 'e.g. 2026-2027')}
            {f('enrollment_year', 'First-year batch (ID year)', 'number', 'Only student IDs starting with this year can register')}
            {f('starts_on', 'Starts', 'date')}
            {f('ends_on', 'Ends', 'date')}
        </div>
    );
}

export default function SchoolYearPanel({ data }) {
    const { active, activeCount, archived = [], audit = [], backupReady } = data;
    const [downloaded, setDownloaded] = useState(backupReady);

    const editForm = useForm(
        active
            ? { name: active.name, enrollment_year: String(active.enrollment_year), starts_on: active.starts_on, ends_on: active.ends_on }
            : nextYearDefaults(null),
    );
    const newForm = useForm(nextYearDefaults(archived[0] ?? null));
    const closeForm = useForm({ confirm: '' });
    const confirmText = active ? `ARCHIVE ${active.name}` : '';

    return (
        <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900">School year</h2>
            <p className="mb-5 text-sm text-gray-500">
                Only first years of the active school year can register as cadets. The next school year starts
                automatically (default Aug 1); you get a reminder 2 weeks before a year ends. Closing a year archives its cadets,
                aspirants, events and attendance (restorable for 30 days, then deleted; login accounts are deleted after
                one year).
            </p>

            {active ? (
                <>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            editForm.put(route('school-year.update', active.school_year_id), { preserveScroll: true });
                        }}
                        className="space-y-4"
                    >
                        <p className="text-sm">
                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">Active</span>{' '}
                            <strong>{active.name}</strong> · {activeCount} cadet/aspirant profile(s)
                        </p>
                        <YearFields form={editForm} prefix="edit_year" />
                        <div className="flex justify-end">
                            <button type="submit" disabled={editForm.processing} className="btn-secondary">
                                Save school year
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 rounded-xl border-2 border-red-200 bg-red-50/50 p-4">
                        <h3 className="font-semibold text-red-800">Close {active.name}</h3>
                        <p className="mb-3 text-sm text-red-700">
                            Archives {activeCount} profile(s) and all of this year&apos;s events and attendance. Only admins can do this.
                        </p>
                        <ol className="space-y-3 text-sm">
                            <li>
                                <span className="font-semibold">1. Download the backup</span> (Excel: attendance sheets + profiles,
                                events and records).
                                <div className="mt-2">
                                    <a
                                        href={route('school-year.backup')}
                                        onClick={() => setTimeout(() => setDownloaded(true), 1500)}
                                        className="btn-secondary"
                                    >
                                        Download backup
                                    </a>
                                    {downloaded && <span className="ml-3 text-emerald-700">✓ Backup downloaded</span>}
                                </div>
                            </li>
                            <li>
                                <span className="font-semibold">2. Type</span>{' '}
                                <code className="rounded bg-white px-1.5 py-0.5 font-mono text-red-700">{confirmText}</code>{' '}
                                to confirm.
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        closeForm.post(route('school-year.close'), { preserveScroll: true, onSuccess: () => closeForm.reset() });
                                    }}
                                    className="mt-2 flex flex-col gap-2 sm:flex-row"
                                >
                                    <input
                                        value={closeForm.data.confirm}
                                        onChange={(e) => closeForm.setData('confirm', e.target.value)}
                                        className="input-field font-mono"
                                        placeholder={confirmText}
                                        disabled={!downloaded}
                                        aria-label="Confirmation text"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!downloaded || closeForm.data.confirm !== confirmText || closeForm.processing}
                                        className="inline-flex shrink-0 items-center justify-center rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-40"
                                    >
                                        Archive school year
                                    </button>
                                </form>
                                {closeForm.errors.confirm && <p className="mt-1 text-sm text-red-600">{closeForm.errors.confirm}</p>}
                            </li>
                        </ol>
                    </div>
                </>
            ) : (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        newForm.post(route('school-year.store'), { preserveScroll: true });
                    }}
                    className="space-y-4"
                >
                    <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                        No active school year: cadet registration is closed. The next school year starts automatically on
                        its start date (default Aug 1), or start it now below.
                    </p>
                    <YearFields form={newForm} prefix="new_year" />
                    <div className="flex justify-end">
                        <button type="submit" disabled={newForm.processing} className="btn-primary">
                            Start school year
                        </button>
                    </div>
                </form>
            )}

            {archived.length > 0 && (
                <div className="mt-6">
                    <h3 className="mb-2 text-sm font-semibold text-gray-700">Archived school years</h3>
                    <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
                        {archived.map((y) => (
                            <li key={y.school_year_id} className="flex items-center justify-between gap-3 p-3 text-sm">
                                <div>
                                    <p className="font-semibold text-gray-900">{y.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {y.status === 'purged'
                                            ? 'Deleted after 30 days'
                                            : `Archived ${y.archived_at} · restorable until ${y.restorable_until}`}
                                    </p>
                                </div>
                                {y.can_restore && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            confirm(`Restore ${y.name}? Its cadets, events and attendance come back.`) &&
                                            router.post(route('school-year.restore', y.school_year_id), {}, { preserveScroll: true })
                                        }
                                        disabled={!!active}
                                        title={active ? 'Close the active school year first' : ''}
                                        className="btn-secondary px-3 py-1.5 text-xs"
                                    >
                                        Restore
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="mt-6">
                <h3 className="mb-2 text-sm font-semibold text-gray-700">Activity log</h3>
                {audit.length === 0 ? (
                    <p className="text-sm text-gray-400">No activity yet.</p>
                ) : (
                    <ul className="max-h-64 divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-200 text-xs">
                        {audit.map((a) => (
                            <li key={a.id} className="flex flex-wrap justify-between gap-2 p-2.5">
                                <span>
                                    <strong>{ACTION_LABELS[a.action] ?? a.action}</strong>
                                    {a.details?.name && ` · ${a.details.name}`}
                                    {a.details?.count !== undefined && ` · ${a.details.count} profile(s)`}
                                    {a.details?.profiles !== undefined && ` · ${a.details.profiles} profile(s)`}
                                    {a.details?.student_id && ` · ${a.details.student_id}`}
                                </span>
                                <span className="text-gray-500">
                                    {a.who} · {a.when}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
