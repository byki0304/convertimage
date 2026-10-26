import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  href?: string;
}

const SIZES = {
  sm: { mark: 'h-7 w-7 text-sm', text: 'text-base' },
  md: { mark: 'h-9 w-9 text-lg', text: 'text-xl' },
  lg: { mark: 'h-14 w-14 text-3xl', text: 'text-3xl' },
};

export function Logo({ size = 'md', href = '/' }: LogoProps) {
  const s = SIZES[size];
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5" aria-label="convertimage">
      <span
        className={`relative grid shrink-0 place-items-center rounded-xl border border-neon-cyan/60 bg-obsidian-card font-black text-neon-cyan shadow-neon-cyan ${s.mark}`}
      >
        <span className="absolute inset-0 animate-portal-spin rounded-xl border border-dashed border-neon-magenta/40" />
        <span className="drop-shadow-[0_0_6px_#00F0FF]">c</span>
      </span>
      <span className={`neon-text font-extrabold tracking-tight ${s.text}`}>
        convert<span className="text-neon-magenta drop-shadow-[0_0_8px_#FF0055]">image</span>
      </span>
    </Link>
  );
}
