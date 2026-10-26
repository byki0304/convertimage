'use client';

import { ChevronIcon } from '@/components/ui/NeonIcons';
import { TARGET_FORMATS, type TargetFormat } from '@/types';

interface FormatSelectProps {
  value: TargetFormat;
  onChange: (format: TargetFormat) => void;
  ariaLabel?: string;
}

export function FormatSelect({ value, onChange, ariaLabel }: FormatSelectProps) {
  return (
    <label className="relative inline-flex items-center">
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value as TargetFormat)}
        className="h-8 cursor-pointer appearance-none rounded-lg border border-neon-cyan/40 bg-obsidian-card py-0 pl-3 pr-7 font-mono text-xs font-bold uppercase text-neon-cyan outline-none transition-shadow focus:shadow-neon-cyan"
      >
        {TARGET_FORMATS.map((format) => (
          <option key={format} value={format} className="bg-obsidian-card text-white">
            {format.toUpperCase()}
          </option>
        ))}
      </select>
      <ChevronIcon direction="down" className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-neon-cyan" glow={false} />
    </label>
  );
}
