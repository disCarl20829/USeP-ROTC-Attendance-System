import { Head, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            <div className="mb-6 flex items-center gap-3 rounded-lg bg-[#7B1E1E]/5 p-4">
                <EnvelopeIcon className="h-6 w-6 text-[#7B1E1E]" />
                <p className="text-sm text-gray-600">
                    Thanks for signing up! Before getting started, could you verify your email address by clicking on the link we just emailed to you?
                </p>
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700">
                    A new verification link has been sent to the email address you provided during registration.
                </div>
            )}

            <form onSubmit={submit}>
                <div className="flex items-center justify-between">
                    <a href={route('logout')} method="post" as="button" className="flex items-center text-sm text-[#7B1E1E] hover:underline">
                        <ArrowLeftIcon className="mr-1 h-4 w-4" />
                        Log out
                    </a>
                    <button type="submit" disabled={processing} className="btn-primary">
                        {processing ? 'Sending...' : 'Resend Verification Email'}
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
