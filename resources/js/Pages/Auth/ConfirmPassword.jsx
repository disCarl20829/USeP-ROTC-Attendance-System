import { Head, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { LockClosedIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Confirm Password" />

            <div className="mb-6 flex items-center gap-3 rounded-lg bg-[#7B1E1E]/5 p-4">
                <ShieldCheckIcon className="h-6 w-6 text-[#7B1E1E]" />
                <p className="text-sm text-gray-600">
                    This is a secure area of the application. Please confirm your password before continuing.
                </p>
            </div>

            <form onSubmit={submit}>
                <div>
                    <label htmlFor="password" className="label-text">Password</label>
                    <div className="relative">
                        <LockClosedIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                            id="password"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="input-field pl-10"
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            autoFocus
                        />
                    </div>
                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>

                <div className="mt-6 flex justify-end">
                    <button type="submit" disabled={processing} className="btn-primary">
                        {processing ? 'Confirming...' : 'Confirm'}
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
