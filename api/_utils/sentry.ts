import * as Sentry from '@sentry/node';

// Inicializar Sentry una sola vez
let initialized = false;

export function initSentry() {
  if (initialized) return;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV || 'development',
    enabled: process.env.VERCEL_ENV === 'production', // Solo en producción
    tracesSampleRate: 0.1, // 10% de transacciones
    // Filtrar información sensible
    beforeSend(event) {
      // No enviar headers con tokens
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      return event;
    },
  });

  initialized = true;
}

// Helper para capturar excepciones con contexto
export function captureException(error: unknown, context?: Record<string, any>) {
  if (context) {
    Sentry.setContext('custom', context);
  }
  Sentry.captureException(error);
}

// Helper para capturar mensajes
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}
