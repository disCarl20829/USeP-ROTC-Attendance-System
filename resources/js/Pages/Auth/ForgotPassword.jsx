import { Head, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            {status && (
                <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700">
                    {status}
                </div>
            )}

            <p className="mb-6 text-sm text-gray-600">
                Forgot your password? No problem. Just let us know your email address and we will email you a password reset link.
            </p>

            <form onSubmit={submit}>
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
                            placeholder="you@example.com"
                            autoFocus
                        />
                    </div>
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <a href={route('login')} className="flex items-center text-sm text-[#7B1E1E] hover:underline">
                        <ArrowLeftIcon className="mr-1 h-4 w-4" />
                        Back to login
                    </a>
                    <button type="submit" disabled={processing} className="btn-primary">
                        {processing ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
