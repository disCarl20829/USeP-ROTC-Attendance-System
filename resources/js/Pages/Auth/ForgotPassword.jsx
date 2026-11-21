import { Head, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import FormField from '@/Components/FormField';
import StatusMessage from '@/Components/StatusMessage';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Forgot password" />
            <StatusMessage status={status} />

            <h2 className="mb-1 text-lg font-bold text-gray-900">Forgot your password?</h2>
            <p className="mb-6 text-sm text-gray-600">
                Enter your USeP email. We&apos;ll send you a 6-digit code and a reset link.
            </p>

            <form onSubmit={submit} className="space-y-4">
                <FormField id="email" label="USeP email" error={errors.email}>
                    <input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        className="input-field"
                        placeholder="you@usep.edu.ph"
                        autoComplete="username"
                        autoFocus
                        required
                    />
                </FormField>

                <div className="flex items-center justify-between pt-2">
                    <a href={route('login')} className="text-sm text-[#7B1E1E] hover:underline">
                        Back to login
                    </a>
                    <button type="submit" disabled={processing} className="btn-primary">
                        {processing ? 'Sending…' : 'Send reset code'}
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
