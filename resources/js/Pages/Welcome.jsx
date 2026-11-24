import { useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import RotcLogo from '@/Components/RotcLogo';
import VideoGuide from '@/Components/VideoGuide';

const STEPS = [
    {
        title: 'Register',
        text: 'First-year cadets sign up with their USeP email and student ID, then confirm the email.',
    },
    {
        title: 'Show your QR code',
        text: 'Your personal QR code is on your dashboard. Officers scan it at formation, in and out.',
    },
    {
        title: 'Track your points',
        text: 'Present, late, excused and absent are recorded per session and shown on your dashboard.',
    },
];

export default function Welcome({ auth, videoId = null }) {
    // If Supabase sent an email link back to the home page (Site URL fallback),
    // hand the tokens to the callback page.
    useEffect(() => {
        if (/access_token=|error_description=/.test(window.location.hash)) {
            window.location.replace('/auth/callback' + window.location.hash);
        }
    }, []);

    const loggedIn = !!auth?.user;

    return (
        <>
            <Head title="Welcome" />

            <div className="min-h-screen bg-rotc-paper">
                {/* Top bar */}
                <header className="bg-rotc-maroon-dark">
                    <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
                        <Link href="/" className="flex items-center gap-3">
                            <RotcLogo size={36} eager />
                            <span className="whitespace-nowrap font-display text-xl font-semibold tracking-wide text-white">
                                USeP ROTC<span className="hidden sm:inline"> Unit</span>
                            </span>
                        </Link>
                        <nav className="flex items-center gap-1.5 whitespace-nowrap text-sm sm:gap-2">
                            {loggedIn ? (
                                <Link href={route('dashboard')} className="rounded-md bg-rotc-gold px-3.5 py-2 font-semibold text-rotc-maroon-deep hover:bg-rotc-gold-light">
                                    Go to dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link href={route('login')} className="rounded-md px-3.5 py-2 font-medium text-white/85 hover:bg-white/10 hover:text-white">
                                        Log in
                                    </Link>
                                    <Link href={route('register')} className="rounded-md bg-rotc-gold px-3.5 py-2 font-semibold text-rotc-maroon-deep hover:bg-rotc-gold-light">
                                        Register
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                {/* Hero */}
                <section className="border-b-4 border-rotc-gold bg-rotc-maroon">
                    <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-[auto_1fr] md:py-20">
                        <div className="flex justify-center">
                            <RotcLogo size={300} eager className="h-56 w-56 ring-8 ring-white/10 sm:h-72 sm:w-72 md:h-[300px] md:w-[300px]" />
                        </div>
                        <div className="text-center md:text-left">
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rotc-gold-light">
                                University of Southeastern Philippines
                            </p>
                            <h1 className="mt-3 text-5xl font-bold uppercase leading-none text-white sm:text-6xl">
                                ROTC Unit
                                <span className="mt-2 block text-3xl font-semibold text-white/85 sm:text-4xl">Tagum-Mabini Campus</span>
                            </h1>
                            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 md:text-lg">
                                The unit&apos;s QR attendance system for formations. Cadets register once, show their QR code at
                                every formation, and can check their attendance points any time.
                            </p>
                            <p className="mt-4 font-display text-lg font-semibold uppercase tracking-[0.2em] text-rotc-gold">
                                We Serve and Secure
                            </p>
                            <div className="mt-7 flex flex-wrap justify-center gap-3 md:justify-start">
                                {loggedIn ? (
                                    <Link href={route('dashboard')} className="rounded-lg bg-rotc-gold px-5 py-3 text-sm font-semibold text-rotc-maroon-deep hover:bg-rotc-gold-light">
                                        Open my dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link href={route('register')} className="rounded-lg bg-rotc-gold px-5 py-3 text-sm font-semibold text-rotc-maroon-deep hover:bg-rotc-gold-light">
                                            Register as a cadet
                                        </Link>
                                        <Link href={route('login')} className="rounded-lg border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
                                            Log in
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Video guide */}
                <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
                    <div className="mb-6 text-center">
                        <p className="eyebrow">Video guide</p>
                        <h2 className="mt-1 text-4xl font-semibold uppercase text-gray-900">How the attendance system works</h2>
                    </div>
                    <VideoGuide videoId={videoId} />
                </section>

                {/* Steps */}
                <section className="border-t border-gray-200 bg-white">
                    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
                        <ol className="grid gap-8 md:grid-cols-3">
                            {STEPS.map((step, i) => (
                                <li key={step.title} className="border-t-2 border-rotc-maroon pt-4">
                                    <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-rotc-maroon">
                                        Step {i + 1}
                                    </p>
                                    <h3 className="mt-1 text-lg font-semibold text-gray-900">{step.title}</h3>
                                    <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{step.text}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                <footer className="bg-rotc-maroon-deep">
                    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-white/60 sm:flex-row sm:px-6">
                        <div className="flex items-center gap-2">
                            <RotcLogo size={24} />
                            <span>USeP ROTC Unit · Tagum-Mabini Campus</span>
                        </div>
                        <span>&copy; {new Date().getFullYear()} University of Southeastern Philippines</span>
                    </div>
                </footer>
            </div>
        </>
    );
}
