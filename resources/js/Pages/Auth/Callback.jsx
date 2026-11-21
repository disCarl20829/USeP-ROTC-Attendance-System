import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';

/**
 * Landing page for Supabase email links (sign-up confirmation and password reset).
 * Supabase puts the tokens in the URL fragment (#access_token=…), which only the
 * browser can read, so we send them to the server to verify and start the session.
 */
export default function Callback() {
    const [error, setError] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        // Remove the tokens from the address bar / history right away.
        window.history.replaceState(null, '', window.location.pathname);

        if (params.get('error') || params.get('error_description')) {
            const expired = params.get('error_code') === 'otp_expired';
            setError(
                expired
                    ? 'This link has expired or was already used. Log in, or request a new email.'
                    : params.get('error_description')?.replace(/\+/g, ' ') || 'This link is invalid.',
            );
            return;
        }

        if (!params.get('access_token') || !params.get('refresh_token')) {
            setError('This link is missing information. Open the newest email we sent you.');
            return;
        }

        router.post(route('auth.callback.store'), {
            access_token: params.get('access_token'),
            refresh_token: params.get('refresh_token'),
            expires_in: Number(params.get('expires_in') || 3600),
            type: params.get('type') || 'signup',
        });
    }, []);

    return (
        <GuestLayout>
            <Head title="Signing you in" />
            {error ? (
                <div className="space-y-4 text-center">
                    <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>
                    <div className="flex justify-center gap-4 text-sm">
                        <a href={route('login')} className="font-semibold text-[#7B1E1E] hover:underline">
                            Log in
                        </a>
                        <a href={route('password.request')} className="font-semibold text-[#7B1E1E] hover:underline">
                            Reset password
                        </a>
                    </div>
                </div>
            ) : (
                <p className="text-center text-sm text-gray-600">Verifying your link…</p>
            )}
        </GuestLayout>
    );
}
