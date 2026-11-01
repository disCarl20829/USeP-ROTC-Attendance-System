import { Head, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { UserIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
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

            <form onSubmit={submit}>
                <div>
                    <label htmlFor="name" className="label-text">Full Name</label>
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="input-field pl-10"
                            placeholder="Juan Dela Cruz"
                            autoComplete="name"
                            autoFocus
                        />
                    </div>
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div className="mt-4">
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
                            autoComplete="username"
                        />
                    </div>
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div className="mt-4">
                    <label htmlFor="password" className="label-text">Password</label>
                    <div className="relative">
                        <LockClosedIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                            id="password"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="input-field pl-10"
                            placeholder="Create a password"
                            autoComplete="new-password"
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
                            placeholder="Confirm your password"
                            autoComplete="new-password"
                        />
                    </div>
                    {errors.password_confirmation && <p className="mt-1 text-sm text-red-600">{errors.password_confirmation}</p>}
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <a href={route('login')} className="text-sm text-[#7B1E1E] hover:underline">
                        Already registered?
                    </a>
                    <button type="submit" disabled={processing} className="btn-primary">
                        {processing ? 'Creating account...' : 'Create account'}
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
