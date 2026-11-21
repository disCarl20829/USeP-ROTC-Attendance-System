const STEPS = ['Account', 'Verify email', 'Cadet details'];

/** Progress indicator for the 3-step registration. `current` is 1-based. */
export default function RegisterSteps({ current }) {
    return (
        <ol className="mb-6 flex items-center justify-between gap-2 text-xs font-semibold">
            {STEPS.map((label, i) => {
                const step = i + 1;
                const done = step < current;
                const active = step === current;
                return (
                    <li key={label} className="flex flex-1 flex-col items-center gap-1 text-center">
                        <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full ${
                                done
                                    ? 'bg-emerald-600 text-white'
                                    : active
                                      ? 'bg-[#7B1E1E] text-white'
                                      : 'bg-gray-200 text-gray-500'
                            }`}
                        >
                            {done ? '✓' : step}
                        </span>
                        <span className={active ? 'text-[#7B1E1E]' : 'text-gray-500'}>{label}</span>
                    </li>
                );
            })}
        </ol>
    );
}
