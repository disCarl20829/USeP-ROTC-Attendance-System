import { Head, Link, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import FormField, { SelectField, toOptions } from '@/Components/FormField';
import RegisterSteps from '@/Components/RegisterSteps';
import StatusMessage from '@/Components/StatusMessage';

/** Register step 3: technical info. Role is always Cadet. */
export default function Setup({ email, prefill = {}, linked = false, options = {} }) {
    const str = (v) => (v === null || v === undefined ? '' : String(v));

    const { data, setData, post, processing, errors } = useForm({
        first_name: prefill.first_name ?? '',
        middle_name: prefill.middle_name ?? '',
        last_name: prefill.last_name ?? '',
        student_id: prefill.student_id ?? '',
        campus_id: str(prefill.campus_id),
        course_id: str(prefill.course_id),
        platoon_id: str(prefill.platoon_id),
        specialization_id: str(prefill.specialization_id),
    });

    const courseOptions = toOptions.courses(options.courses, data.campus_id);

    const changeCampus = (campusId) => {
        setData((d) => ({
            ...d,
            campus_id: campusId,
            // Clear the course if it is not offered on the new campus.
            course_id: toOptions.courses(options.courses, campusId).some((c) => c.value === d.course_id)
                ? d.course_id
                : '',
        }));
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('setup.store'));
    };

    return (
        <GuestLayout wide>
            <Head title="Set up your account" />
            <RegisterSteps current={3} />
            <StatusMessage />

            <div className="mb-5">
                <h2 className="text-lg font-bold text-gray-900">Cadet details</h2>
                <p className="text-sm text-gray-500">
                    Signed in as <strong>{email}</strong>. Your role will be <strong>Cadet</strong>.
                </p>
                {linked && (
                    <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                        An officer already added you to the roster. Check the details below; your existing attendance
                        records will be linked to this account.
                    </p>
                )}
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <FormField id="first_name" label="First name" error={errors.first_name}>
                        <input
                            id="first_name"
                            value={data.first_name}
                            onChange={(e) => setData('first_name', e.target.value)}
                            className="input-field"
                            required
                        />
                    </FormField>
                    <FormField id="middle_name" label="Middle name" error={errors.middle_name} hint="Optional">
                        <input
                            id="middle_name"
                            value={data.middle_name}
                            onChange={(e) => setData('middle_name', e.target.value)}
                            className="input-field"
                            autoComplete="additional-name"
                        />
                    </FormField>
                    <FormField id="last_name" label="Last name" error={errors.last_name}>
                        <input
                            id="last_name"
                            value={data.last_name}
                            onChange={(e) => setData('last_name', e.target.value)}
                            className="input-field"
                            required
                        />
                    </FormField>
                </div>

                <FormField id="student_id" label="Student ID" error={errors.student_id} hint="e.g. 2023-00123">
                    <input
                        id="student_id"
                        value={data.student_id}
                        onChange={(e) => setData('student_id', e.target.value.trim())}
                        className="input-field font-mono"
                        placeholder="2023-00123"
                        required
                    />
                </FormField>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField id="campus_id" label="Campus" error={errors.campus_id}>
                        <SelectField
                            id="campus_id"
                            value={data.campus_id}
                            onChange={changeCampus}
                            options={toOptions.campuses(options.campuses)}
                            placeholder="Select campus"
                        />
                    </FormField>
                    <FormField id="course_id" label="Course" error={errors.course_id}>
                        <SelectField
                            id="course_id"
                            value={data.course_id}
                            onChange={(v) => setData('course_id', v)}
                            options={courseOptions}
                            placeholder={data.campus_id ? 'Select course' : 'Select a campus first'}
                            disabled={!data.campus_id}
                        />
                    </FormField>
                    <FormField id="platoon_id" label="Platoon" error={errors.platoon_id}>
                        <SelectField
                            id="platoon_id"
                            value={data.platoon_id}
                            onChange={(v) => setData('platoon_id', v)}
                            options={toOptions.platoons(options.platoons)}
                            placeholder="Select platoon"
                        />
                    </FormField>
                    <FormField id="specialization_id" label="Specialization" error={errors.specialization_id}>
                        <SelectField
                            id="specialization_id"
                            value={data.specialization_id}
                            onChange={(v) => setData('specialization_id', v)}
                            options={toOptions.specializations(options.specializations)}
                            placeholder="Select specialization"
                        />
                    </FormField>
                </div>

                <p className="text-xs text-gray-500">
                    You can change your platoon and specialization later in Settings.
                </p>

                <div className="flex items-center justify-between pt-2">
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
                    >
                        Log out
                    </Link>
                    <button type="submit" disabled={processing} className="btn-primary">
                        {processing ? 'Creating account…' : 'Finish & create my QR code'}
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
