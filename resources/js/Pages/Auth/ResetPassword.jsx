import { Head, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import FormField from '@/Components/FormField';
import StatusMessage from '@/Components/StatusMessage';

/**
 * Step 1 (ready = false): enter the emailed code.
 * Step 2 (ready = true, after the code or the email link): choose a new password.
 */
export default function ResetPassword({ email = '', ready = false }) {
    const codeForm = useForm({ email, code: '' });
    const passwordForm = useForm({ password: '', password_confirmation: '' });

    const submitCode = (e) => {
        e.preventDefault();
        codeForm.post(route('password.code'));
    };

    const submitPassword = (e) => {
        e.preventDefault();
        passwordForm.post(route('password.store'), {
            onFinish: () => passwordForm.reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Reset password" />
            <StatusMessage />

            {!ready ? (
                <>
                    <h2 className="mb-1 text-lg font-bold text-gray-900">Enter your reset code</h2>
                    <p className="mb-6 text-sm text-gray-600">
                        Type the 6-digit code from the email, or just click the reset link in it.
                    </p>
                    <form onSubmit={submitCode} className="space-y-4">
                        <FormField id="email" label="USeP email" error={codeForm.errors.email}>
                            <input
                                id="email"
                                type="email"
                                value={codeForm.data.email}
                                onChange={(e) => codeForm.setData('email', e.target.value)}
                                className="input-field"
                                autoComplete="username"
                                required
                            />
                        </FormField>
                        <FormField id="code" label="Reset code" error={codeForm.errors.code}>
                            <input
                                id="code"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={10}
                                value={codeForm.data.code}
                                onChange={(e) => codeForm.setData('code', e.target.value.replace(/\D/g, ''))}
                                className="input-field text-center font-mono text-2xl tracking-[0.5em]"
                                placeholder="••••••"
                                autoFocus
                                required
                            />
                        </FormField>
                        <div className="flex items-center justify-between pt-2">
                            <a href={route('password.request')} className="text-sm text-[#7B1E1E] hover:underline">
                                Send a new code
                            </a>
                            <button
                                type="submit"
                                disabled={codeForm.processing || codeForm.data.code.length < 6}
                                className="btn-primary"
                            >
                                {codeForm.processing ? 'Checking…' : 'Continue'}
                            </button>
                        </div>
                    </form>
                </>
            ) : (
                <>
                    <h2 className="mb-1 text-lg font-bold text-gray-900">Choose a new password</h2>
                    <p className="mb-6 text-sm text-gray-600">At least 12 characters.</p>
                    <form onSubmit={submitPassword} className="space-y-4">
                        <FormField id="password" label="New password" error={passwordForm.errors.password}>
                            <input
                                id="password"
                                type="password"
                                value={passwordForm.data.password}
                                onChange={(e) => passwordForm.setData('password', e.target.value)}
                                className="input-field"
                                autoComplete="new-password"
                                autoFocus
                                required
                            />
                        </FormField>
                        <FormField
                            id="password_confirmation"
                            label="Confirm new password"
                            error={passwordForm.errors.password_confirmation}
                        >
                            <input
                                id="password_confirmation"
                                type="password"
                                value={passwordForm.data.password_confirmation}
                                onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                className="input-field"
                                autoComplete="new-password"
                                required
                            />
                        </FormField>
                        <button type="submit" disabled={passwordForm.processing} className="btn-primary w-full">
                            {passwordForm.processing ? 'Saving…' : 'Save new password'}
                        </button>
                    </form>
                </>
            )}
        </GuestLayout>
    );
}
