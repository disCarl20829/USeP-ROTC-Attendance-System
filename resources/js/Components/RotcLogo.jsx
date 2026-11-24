/** The USeP ROTC Unit seal (public/images/rotc-logo.*). */
export default function RotcLogo({ size = 40, className = '', eager = false }) {
    const small = size <= 96;
    return (
        <img
            src={small ? '/images/rotc-logo-192.webp' : '/images/rotc-logo.webp'}
            width={size}
            height={size}
            alt="USeP ROTC Unit seal, Tagum-Mabini Campus"
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            className={`shrink-0 select-none rounded-full ${className}`}
            style={{ width: size, height: size }}
        />
    );
}
