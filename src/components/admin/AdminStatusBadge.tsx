import { cn } from '@/lib/utils';
import { ORDER_STATUS_LABEL } from '@/domain/state-machines';
import type { OrderStatus } from '@prisma/client';

const TONE: Record<OrderStatus, string> = {
  PENDIENTE_CONFIRMACION: 'bg-warn-soft text-warn',
  CONFIRMADO: 'bg-gold/15 text-gold-dark',
  EN_CONFECCION: 'bg-gold/15 text-gold-dark',
  CONTROL_CALIDAD: 'bg-gold/15 text-gold-dark',
  ENVIADO: 'bg-success-soft text-success',
  ENTREGADO: 'bg-success-soft text-success',
  CANCELADO: 'bg-error-soft text-error',
};

/** Badge de estado de pedido REAL (Fase 3): estados de la base, no del mock. */
export function AdminStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium tracking-wide',
        TONE[status],
        className,
      )}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
