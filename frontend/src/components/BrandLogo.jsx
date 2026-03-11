import { Link } from 'react-router-dom';

export default function BrandLogo({ to = '/', showText = true, textClassName = 'text-lg font-extrabold tracking-tight text-dark', iconSize = 34 }) {
  const Icon = (
    <span
      className="inline-flex items-center justify-center rounded-xl shadow-soft"
      style={{ width: iconSize, height: iconSize }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hospitoBrandGradient" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2563EB" />
            <stop offset="1" stopColor="#22C55E" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#hospitoBrandGradient)" />
        <path d="M32 15c8 0 14 6 14 14v8c0 8-6 14-14 14s-14-6-14-14v-8c0-8 6-14 14-14Z" fill="white" fillOpacity="0.18" />
        <path d="M30 22h4v8h8v4h-8v8h-4v-8h-8v-4h8v-8Z" fill="white" />
      </svg>
    </span>
  );

  const content = (
    <span className="inline-flex items-center gap-2">
      {Icon}
      {showText ? <span className={textClassName}>HOSPITO</span> : null}
    </span>
  );

  if (!to) return content;

  return (
    <Link to={to} className="inline-flex items-center" aria-label="HOSPITO home">
      {content}
    </Link>
  );
}
