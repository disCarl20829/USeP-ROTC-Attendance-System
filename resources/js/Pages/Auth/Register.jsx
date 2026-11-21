import { Head, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import FormField from '@/Components/FormField';
import RegisterSteps from '@/Components/RegisterSteps';
import StatusMessage from '@/Components/StatusMessage';

/** Register step 1: general info. */
export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />
            <RegisterSteps current={1} />
            <StatusMessage />

            <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField id="first_name" label="First name" error={errors.first_name}>
                        <input
                            id="first_name"
                            value={data.first_name}
                            onChange={(e) => setData('first_name', e.target.value)}
                            className="input-field"
                            autoComplete="given-name"
                            autoFocus
                            required
                        />
                    </FormField>
                    <FormField id="last_name" label="Last name" error={errors.last_name}>
                        <input
                            id="last_name"
                            value={data.last_name}
                            onChange={(e) => setData('last_name', e.target.value)}
                            className="input-field"
                            autoComplete="family-name"
                            required
                        />
                    </FormField>
                </div>

                <FormField id="email" label="USeP email" error={errors.email} hint="Must end with @usep.edu.ph">
                    <input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        className="input-field"
                        placeholder="you@usep.edu.ph"
                        autoComplete="username"
                        required
                    />
                </FormField>

                <FormField id="password" label="Password" error={errors.password} hint="At least 12 characters">
                    <input
                        id="password"
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        className="input-field"
                        autoComplete="new-password"
                        required
                    />
                </FormField>

                <FormField id="password_confirmation" label="Confirm password" error={errors.password_confirmation}>
                    <input
                        id="password_confirmation"
                        type="password"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        className="input-field"
                        autoComplete="new-password"
                        required
                    />
                </FormField>

                <div className="flex items-center justify-between pt-2">
                    <a href={route('login')} className="text-sm text-[#7B1E1E] hover:underline">
                        Already registered?
                    </a>
                    <button type="submit" disabled={processing} className="btn-primary">
                        {processing ? 'Sending code…' : 'Continue'}
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
