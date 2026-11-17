'use client';

import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'gold' | 'outline' | 'ghost' | 'dark-outline';
type Size = 'sm' | 'md' | 'lg';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-charcoal text-ivory hover:bg-charcoal-soft',
  gold: 'bg-gold text-charcoal hover:bg-gold-light',
  outline: 'border border-charcoal/30 bg-transparent text-charcoal hover:border-gold hover:text-gold-dark',
  'dark-outline': 'border border-ivory/40 bg-transparent text-ivory hover:border-gold hover:text-gold',
  ghost: 'bg-transparent text-charcoal hover:text-gold-dark',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-[11px]',
  md: 'px-6 py-3 text-xs',
  lg: 'px-8 py-3.5 text-xs',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 uppercase tracking-[0.22em] font-medium',
        'transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
