/**
 * Logger estructurado mínimo (observabilidad base).
 * - Salida JSON de una línea por evento, fácil de filtrar.
 * - Regla de seguridad: jamás loguear secretos, tokens, contraseñas
 *   ni datos personales completos de clientas.
 */

type LogEvent = Record<string, unknown>;

function emit(level: 'info' | 'warn' | 'error', event: string, data: LogEvent = {}) {
  const entry = JSON.stringify({ ts: new Date().toISOString(), level, event, ...data });
  const line = `[venecia] ${entry}`;
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (event: string, data?: LogEvent) => emit('info', event, data),
  warn: (event: string, data?: LogEvent) => emit('warn', event, data),
  error: (event: string, data?: LogEvent) => emit('error', event, data),
};
