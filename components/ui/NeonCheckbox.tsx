'use client';

import { motion } from 'framer-motion';

interface NeonCheckboxProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}

export function NeonCheckbox({ checked, onChange, label, disabled }: NeonCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
        checked
          ? 'border-neon-cyan bg-neon-cyan shadow-[0_0_10px_rgba(0,240,255,0.6)]'
          : 'border-white/30 hover:border-neon-cyan/70'
      }`}
    >
      {checked && (
        <motion.svg
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5 text-on-neon"
          fill="none"
          stroke="currentColor"
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.12 }}
        >
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </motion.svg>
      )}
    </button>
  );
}
