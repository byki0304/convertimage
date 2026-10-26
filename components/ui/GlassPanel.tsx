import type { HTMLAttributes } from 'react';

export function GlassPanel({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`glass-panel rounded-2xl ${className}`} {...props}>
      {children}
    </div>
  );
}
