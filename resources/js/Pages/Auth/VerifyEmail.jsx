import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import FormField from '@/Components/FormField';
import RegisterSteps from '@/Components/RegisterSteps';
import StatusMessage from '@/Components/StatusMessage';

/** Register step 2: enter the emailed code (or click the link in the email). */
export default function VerifyEmail({ email }) {
    const { data, setData, post, processing, errors } = useForm({ code: '' });
    const [resending, setResending] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post('/register/verify');
    };

    const resend = () => {
        setResending(true);
        router.post(route('register.resend'), {}, { onFinish: () => setResending(false), preserveScroll: true });
    };

    return (
        <GuestLayout>
            <Head title="Verify your email" />
            <RegisterSteps current={2} />
            <StatusMessage />

            <p className="mb-4 text-sm text-gray-600">
                We sent a <strong>6-digit code</strong> and a confirmation link to{' '}
                <strong className="text-gray-900">{email}</strong>. Enter the code below, or click the link in the
                email.
            </p>

            <form onSubmit={submit} className="space-y-4">
                <FormField id="code" label="Verification code" error={errors.code}>
                    <input
                        id="code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={10}
                        value={data.code}
                        onChange={(e) => setData('code', e.target.value.replace(/\D/g, ''))}
                        className="input-field text-center font-mono text-2xl tracking-[0.5em]"
                        placeholder="••••••"
                        autoFocus
                        required
                    />
                </FormField>

                <button type="submit" disabled={processing || data.code.length < 6} className="btn-primary w-full">
                    {processing ? 'Verifying…' : 'Verify email'}
                </button>
            </form>

            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4 text-sm">
                <span className="text-gray-500">Didn&apos;t get it? Check spam.</span>
                <button
                    type="button"
                    onClick={resend}
                    disabled={resending}
                    className="font-semibold text-[#7B1E1E] hover:underline disabled:opacity-50"
                >
                    {resending ? 'Sending…' : 'Resend code'}
                </button>
            </div>
        </GuestLayout>
    );
}
