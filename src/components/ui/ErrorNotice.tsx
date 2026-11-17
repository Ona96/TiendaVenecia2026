import { cn } from '@/lib/utils';

interface ErrorNoticeProps {
  /** El mensaje SIEMPRE en texto: el color nunca es el único portador del estado. */
  message: string;
  className?: string;
  id?: string;
}

/**
 * Aviso de error inline para formularios y cargas fallidas.
 * role="alert": lo anuncian los lectores de pantalla al aparecer.
 */
export function ErrorNotice({ message, className, id }: ErrorNoticeProps) {
  return (
    <p id={id} role="alert" className={cn('form-error', className)}>
      <span
        aria-hidden
        className="mt-0.5 inline-flex h-4 w-4 flex-none items-center justify-center rounded-full bg-error text-[10px] font-bold text-white"
      >
        !
      </span>
      <span>{message}</span>
    </p>
  );
}
