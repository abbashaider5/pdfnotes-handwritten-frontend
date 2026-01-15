// Development-only logger utility
// Prevents console output in production builds

const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

export const logger = {
  log: (...args) => {
    if (isDev) {
    }
  },
  error: (...args) => {
    if (isDev) {
      console.error(...args);
    }
  },
  warn: (...args) => {
    if (isDev) {

    }
  },
  info: (...args) => {
    if (isDev) {
    }
  },
  debug: (...args) => {
    if (isDev) {
    }
  },
};

// For production error tracking, you can extend this to send to a service like Sentry
export const logError = (error, context = '') => {
  if (isDev) {
    console.error(`[${context}]`, error);
  }
  // In production, you could send to error tracking service
  // e.g., Sentry.captureException(error);
};
