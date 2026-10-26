'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

type Variant = 'primary' | 'ghost' | 'danger' | 'subtle';
type Size = 'sm' | 'md' | 'lg';

interface NeonButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  children?: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-magenta text-on-neon shadow-[0_0_15px_rgba(0,240,255,0.5)] hover:shadow-[0_0_28px_rgba(0,240,255,0.75),0_0_42px_rgba(255,0,85,0.45)] hover:brightness-125',
  ghost:
    'border border-neon-cyan/50 bg-obsidian-card/60 text-neon-cyan hover:bg-neon-cyan/10 hover:shadow-neon-cyan',
  danger:
    'border border-neon-magenta/50 bg-obsidian-card/60 text-neon-magenta hover:bg-neon-magenta/10 hover:shadow-neon-magenta',
  subtle: 'text-white/70 hover:text-neon-cyan hover:bg-white/5',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
};

export function NeonButton({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  ...props
}: NeonButtonProps) {
  return (
    <motion.button
      type="button"
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      disabled={disabled}
      className={`relative inline-flex select-none items-center justify-center font-semibold tracking-wide transition-[box-shadow,filter,background-color,color] duration-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {icon && <span className="inline-flex h-[1.15em] w-[1.15em] shrink-0">{icon}</span>}
      {children}
    </motion.button>
  );
}
