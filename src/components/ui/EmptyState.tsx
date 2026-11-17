import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Estado vacío estándar de la tienda: nunca una pantalla en blanco.
 * Con mensaje en español neutro y acción sugerida.
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center border border-line bg-white px-8 py-16 text-center',
        className,
      )}
    >
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/5">
          <Icon className="h-6 w-6 text-gold-dark" aria-hidden />
        </div>
      )}
      <p className="mt-5 font-display text-xl text-charcoal">{title}</p>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-charcoal-muted">{description}</p>
      )}
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}
