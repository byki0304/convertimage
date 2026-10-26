import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { glow?: boolean };

function NeonSvg({ glow = true, className = '', children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${glow ? 'drop-shadow-[0_0_6px_currentColor]' : ''} ${className}`}
      {...props}
    >
      {children}
    </svg>
  );
}

export const UploadIcon = (p: IconProps) => (
  <NeonSvg {...p}>
    <path d="M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </NeonSvg>
);

export const ImageIcon = (p: IconProps) => (
  <NeonSvg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path d="m21 16-5-5-8 8" />
  </NeonSvg>
);

export const DownloadIcon = (p: IconProps) => (
  <NeonSvg {...p}>
    <path d="M12 4v12m0 0-4.5-4.5M12 16l4.5-4.5" />
    <path d="M4 20h16" />
  </NeonSvg>
);

export const TrashIcon = (p: IconProps) => (
  <NeonSvg {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </NeonSvg>
);

export const HomeIcon = (p: IconProps) => (
  <NeonSvg {...p}>
    <path d="m3 11 9-7 9 7" />
    <path d="M5 10v10h14V10" />
    <path d="M10 20v-5h4v5" />
  </NeonSvg>
);

export const HistoryIcon = (p: IconProps) => (
  <NeonSvg {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5M12 7v5l3 2" />
  </NeonSvg>
);

export const UserIcon = (p: IconProps) => (
  <NeonSvg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </NeonSvg>
);

export const LogoutIcon = (p: IconProps) => (
  <NeonSvg {...p}>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
    <path d="M10 17l-5-5 5-5M5 12h11" />
  </NeonSvg>
);

export const GlobeIcon = (p: IconProps) => (
  <NeonSvg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </NeonSvg>
);

export const SoundIcon = ({ muted, ...p }: IconProps & { muted?: boolean }) => (
  <NeonSvg {...p}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    {muted ? <path d="m17 9 4 6m0-6-4 6" /> : <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />}
  </NeonSvg>
);

export const MailIcon = (p: IconProps) => (
  <NeonSvg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </NeonSvg>
);

export const PhoneIcon = (p: IconProps) => (
  <NeonSvg {...p}>
    <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
    <path d="M11 18.5h2" />
  </NeonSvg>
);

export const UserPlusIcon = (p: IconProps) => (
  <NeonSvg {...p}>
    <circle cx="10" cy="8" r="4" />
    <path d="M2 21a8 8 0 0 1 14.5-4.6M19 14v6M16 17h6" />
  </NeonSvg>
);

export const GhostIcon = (p: IconProps) => (
  <NeonSvg {...p}>
    <path d="M5 21V10a7 7 0 0 1 14 0v11l-2.5-2-2.3 2-2.2-2-2.2 2-2.3-2L5 21z" />
    <path d="M9.5 10h.01M14.5 10h.01" />
  </NeonSvg>
);

export const BoltIcon = (p: IconProps) => (
  <NeonSvg {...p}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
  </NeonSvg>
);

export const CheckIcon = (p: IconProps) => (
  <NeonSvg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </NeonSvg>
);

export const AlertIcon = (p: IconProps) => (
  <NeonSvg {...p}>
    <path d="M12 3 2 20h20L12 3z" />
    <path d="M12 10v4M12 17h.01" />
  </NeonSvg>
);

export const FilmIcon = (p: IconProps) => (
  <NeonSvg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" />
  </NeonSvg>
);

export const ChevronIcon = ({ direction = 'right', ...p }: IconProps & { direction?: 'left' | 'right' | 'down' }) => (
  <NeonSvg {...p}>
    {direction === 'left' && <path d="m15 5-7 7 7 7" />}
    {direction === 'right' && <path d="m9 5 7 7-7 7" />}
    {direction === 'down' && <path d="m5 9 7 7 7-7" />}
  </NeonSvg>
);

export const KeyboardIcon = (p: IconProps) => (
  <NeonSvg {...p}>
    <rect x="2.5" y="6" width="19" height="12" rx="2" />
    <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" />
  </NeonSvg>
);

export const SunIcon = (p: IconProps) => (
  <NeonSvg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </NeonSvg>
);

export const MoonIcon = (p: IconProps) => (
  <NeonSvg {...p}>
    <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
  </NeonSvg>
);

export const LockIcon = (p: IconProps) => (
  <NeonSvg {...p}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2.5" />
  </NeonSvg>
);

export const GoogleIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
    <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
  </svg>
);
