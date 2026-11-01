import { Head, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Reset Password" />

            <form onSubmit={submit}>
                <input type="hidden" name="token" value={data.token} />

                <div>
                    <label htmlFor="email" className="label-text">Email</label>
                    <div className="relative">
                        <EnvelopeIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="input-field pl-10"
                            readOnly
                        />
                    </div>
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div className="mt-4">
                    <label htmlFor="password" className="label-text">New Password</label>
                    <div className="relative">
                        <LockClosedIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                            id="password"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="input-field pl-10"
                            placeholder="Create a new password"
                            autoComplete="new-password"
                            autoFocus
                        />
                    </div>
                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>

                <div className="mt-4">
                    <label htmlFor="password_confirmation" className="label-text">Confirm Password</label>
                    <div className="relative">
                        <LockClosedIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                            id="password_confirmation"
                            type="password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            className="input-field pl-10"
                            placeholder="Confirm your new password"
                            autoComplete="new-password"
                        />
                    </div>
                    {errors.password_confirmation && <p className="mt-1 text-sm text-red-600">{errors.password_confirmation}</p>}
                </div>

                <div className="mt-6 flex justify-end">
                    <button type="submit" disabled={processing} className="btn-primary">
                        {processing ? 'Resetting...' : 'Reset Password'}
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
