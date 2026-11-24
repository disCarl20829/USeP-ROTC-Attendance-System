import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import FormField, { SelectField, toOptions } from '@/Components/FormField';
import SchoolYearPanel from '@/Components/SchoolYearPanel';
import PlatoonUnitsPanel from '@/Components/PlatoonUnitsPanel';

export default function Settings({ profile = {}, utility = {}, options = {}, can = {}, schoolYears = null, platoonAdmin = null }) {
    const str = (v) => (v === null || v === undefined ? '' : String(v));

    const profileForm = useForm({
        first_name: profile.first_name ?? '',
        middle_name: profile.middle_name ?? '',
        last_name: profile.last_name ?? '',
        student_id: profile.student_id ?? '',
        campus_id: str(profile.campus_id),
        course_id: str(profile.course_id),
        platoon_id: str(profile.platoon_id),
        platoon_unit_id: str(profile.platoon_unit_id),
        specialization_id: str(profile.specialization_id),
    });

    const systemForm = useForm({
        default_start_time: utility.default_start_time ?? '08:00',
        default_end_time: utility.default_end_time ?? '17:00',
        default_late_time: utility.default_late_time ?? '08:15',
        welcome_video_url: utility.welcome_video_url ?? '',
    });

    const pd = profileForm.data;
    const pe = profileForm.errors;

    const changeCampus = (campusId) => {
        profileForm.setData((d) => ({
            ...d,
            campus_id: campusId,
            course_id: toOptions.courses(options.courses, campusId).some((c) => c.value === d.course_id) ? d.course_id : '',
        }));
    };

    const saveProfile = (e) => {
        e.preventDefault();
        profileForm.put(route('settings.profile'), { preserveScroll: true });
    };

    const saveSystem = (e) => {
        e.preventDefault();
        systemForm.put(route('settings.system'), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout header="Settings">
            <Head title="Settings" />

            <div className="mx-auto max-w-3xl space-y-6">
                <div className="card p-6">
                    <h2 className="text-lg font-semibold text-gray-900">My profile</h2>
                    <p className="mb-5 text-sm text-gray-500">
                        {profile.email} · Role: <strong>{profile.role}</strong>
                    </p>

                    <form onSubmit={saveProfile} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField id="first_name" label="First name" error={pe.first_name}>
                                <input
                                    id="first_name"
                                    value={pd.first_name}
                                    onChange={(e) => profileForm.setData('first_name', e.target.value)}
                                    className="input-field"
                                    required
                                />
                            </FormField>
                            <FormField id="last_name" label="Last name" error={pe.last_name}>
                                <input
                                    id="last_name"
                                    value={pd.last_name}
                                    onChange={(e) => profileForm.setData('last_name', e.target.value)}
                                    className="input-field"
                                    required
                                />
                            </FormField>
                            <FormField id="middle_name" label="Middle name" error={pe.middle_name} hint="Optional">
                                <input
                                    id="middle_name"
                                    value={pd.middle_name}
                                    onChange={(e) => profileForm.setData('middle_name', e.target.value)}
                                    className="input-field"
                                    autoComplete="additional-name"
                                />
                            </FormField>
                            <FormField id="student_id" label="Student ID" error={pe.student_id}>
                                <input
                                    id="student_id"
                                    value={pd.student_id}
                                    onChange={(e) => profileForm.setData('student_id', e.target.value.trim())}
                                    className="input-field font-mono"
                                    required
                                />
                            </FormField>
                            <FormField id="campus_id" label="Campus" error={pe.campus_id}>
                                <SelectField
                                    id="campus_id"
                                    value={pd.campus_id}
                                    onChange={changeCampus}
                                    options={toOptions.campuses(options.campuses)}
                                    placeholder="Select campus"
                                />
                            </FormField>
                            <FormField id="course_id" label="Course" error={pe.course_id} className="sm:col-span-2">
                                <SelectField
                                    id="course_id"
                                    value={pd.course_id}
                                    onChange={(v) => profileForm.setData('course_id', v)}
                                    options={toOptions.courses(options.courses, pd.campus_id)}
                                    placeholder="Select course"
                                    disabled={!pd.campus_id}
                                />
                            </FormField>
                            <FormField
                                id="platoon_id"
                                label="Platoon"
                                error={pe.platoon_id}
                                hint={can.assign ? null : 'Ask an officer to change this.'}
                            >
                                <SelectField
                                    id="platoon_id"
                                    value={pd.platoon_id}
                                    onChange={(v) => profileForm.setData((d) => ({ ...d, platoon_id: v, platoon_unit_id: '' }))}
                                    options={toOptions.platoons(options.platoons)}
                                    placeholder="Unspecified"
                                    disabled={!can.assign}
                                />
                            </FormField>
                            <FormField id="platoon_unit_id" label="Platoon number" error={pe.platoon_unit_id}>
                                <SelectField
                                    id="platoon_unit_id"
                                    value={pd.platoon_unit_id}
                                    onChange={(v) => profileForm.setData('platoon_unit_id', v)}
                                    options={toOptions.platoonUnits(options.platoonUnits, pd.platoon_id)}
                                    placeholder={pd.platoon_id ? 'Select number' : 'Select a platoon first'}
                                    disabled={!can.assign || !pd.platoon_id}
                                />
                            </FormField>
                            <FormField
                                id="specialization_id"
                                label="Specialization"
                                error={pe.specialization_id}
                                hint={can.assign ? null : 'Ask an officer to change this.'}
                            >
                                <SelectField
                                    id="specialization_id"
                                    value={pd.specialization_id}
                                    onChange={(v) => profileForm.setData('specialization_id', v)}
                                    options={toOptions.specializations(options.specializations)}
                                    placeholder="Unspecified"
                                    disabled={!can.assign}
                                />
                            </FormField>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <Link href={route('password.request')} className="text-sm text-[#7B1E1E] hover:underline">
                                Change password
                            </Link>
                            <button type="submit" disabled={profileForm.processing} className="btn-primary">
                                {profileForm.processing ? 'Saving…' : 'Save profile'}
                            </button>
                        </div>
                    </form>
                </div>

                {schoolYears && <SchoolYearPanel data={schoolYears} />}

                {platoonAdmin && <PlatoonUnitsPanel platoons={platoonAdmin} />}

                {can.system && (
                    <div className="card p-6">
                        <h2 className="text-lg font-semibold text-gray-900">System settings</h2>
                        <p className="mb-5 text-sm text-gray-500">Default session times for new events, and the home page video (admin only).</p>

                        <form onSubmit={saveSystem} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                {[
                                    ['default_start_time', 'Start time'],
                                    ['default_late_time', 'Late after'],
                                    ['default_end_time', 'End time'],
                                ].map(([key, label]) => (
                                    <FormField key={key} id={key} label={label} error={systemForm.errors[key]}>
                                        <input
                                            id={key}
                                            type="time"
                                            value={systemForm.data[key]}
                                            onChange={(e) => systemForm.setData(key, e.target.value)}
                                            className="input-field"
                                            required
                                        />
                                    </FormField>
                                ))}
                            </div>
                            <FormField
                                id="welcome_video_url"
                                label="Welcome page video (YouTube link)"
                                error={systemForm.errors.welcome_video_url}
                                hint="Shown in the Video guide section of the home page. Leave empty to show a placeholder."
                            >
                                <input
                                    id="welcome_video_url"
                                    type="url"
                                    value={systemForm.data.welcome_video_url}
                                    onChange={(e) => systemForm.setData('welcome_video_url', e.target.value)}
                                    className="input-field"
                                    placeholder="https://www.youtube.com/watch?v=…"
                                />
                            </FormField>
                            <div className="flex justify-end">
                                <button type="submit" disabled={systemForm.processing} className="btn-primary">
                                    {systemForm.processing ? 'Saving…' : 'Save settings'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
