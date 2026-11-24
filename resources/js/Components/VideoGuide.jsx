import RotcLogo from '@/Components/RotcLogo';

/**
 * 16:9 video frame for the welcome page. `videoId` is a YouTube video id set by an
 * admin in Settings; youtube-nocookie avoids tracking cookies until the video plays.
 */
export default function VideoGuide({ videoId, title = 'USeP ROTC attendance system guide' }) {
    return (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-gray-300 bg-rotc-maroon-deep">
            {videoId ? (
                <iframe
                    className="absolute inset-0 h-full w-full"
                    src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
                    title={title}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                />
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                    <RotcLogo size={88} className="opacity-90" />
                    <div>
                        <p className="font-display text-2xl font-semibold uppercase tracking-wide text-white">Video guide</p>
                        <p className="mt-1 text-sm text-white/70">The walkthrough video will be posted here soon.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
