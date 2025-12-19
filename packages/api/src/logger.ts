import { nanoid } from "nanoid";
import type { Logger } from "pino";
import pino from "pino";

/** Default logger instance for use throughout the application */
export const logger = pino({ level: "info" });

/** Determines the log level based on environment bindings. */
const getLogLevel = (env: Env) =>
  env.LOG_LEVEL || (env.NODE_ENV === "production" ? "info" : "debug");

/** Pino logger options optimized for Cloudflare Workers or development. */
const getLoggerOptions = (env: Env): pino.LoggerOptions => {
  const logLevel = getLogLevel(env);
  const isProduction = env.NODE_ENV === "production";

  if (isProduction) {
    // Production: Use JSON logging suitable for Cloudflare
    return {
      level: logLevel,
      browser: {
        asObject: true,
        formatters: {
          level(label) {
            return { level: label.toUpperCase() };
          },
        },
        write: (o) => console.log(JSON.stringify(o)),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      enabled: true,
    };
  }

  // Development: Use pino-pretty transport (default if not production)
  return {
    level: logLevel,
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard", // Use system time, format: yyyy-mm-dd HH:MM:ss.l o
        ignore: "pid,hostname", // Ignore these common fields for cleaner dev logs
        levelFirst: true, // Show level first
        singleLine: true, // Try to keep logs on a single line
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime, // Still include timestamp for processing
    enabled: true,
  };
};

/** Creates a new logger instance with environment bindings. */
export function createLogger(env: Env): Logger {
  const instance = pino(getLoggerOptions(env));
  instance.info(
    `Logger initialized (level: ${getLogLevel(env)}, env: ${env.NODE_ENV || "development"})`
  );
  return instance;
}

/**
 * Creates a child logger with request context.
 * @param parent - Parent logger instance
 * @param requestId - Optional request ID. If not provided, a new one will be generated.
 * @returns A child logger with request context
 */
export function createRequestLogger(
  parent: Logger,
  requestId?: string
): Logger {
  const id = requestId || nanoid();
  return parent.child({ requestId: id });
}
