import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { StatusCode } from "hono/utils/http-status";
import { ZodError, type z } from "zod";

import crmRouter from "../domains/crm/routes";
import headlinesRouter from "../domains/headlines/routes";
import surveysRouter from "../domains/surveys/routes";
import { createLogger, createRequestLogger } from "../logger";
import type { StandardErrorSchema } from "../schema";

/**
 * Creates a main application router with all sub-routes
 */
export function createAppRouter() {
  const app = new Hono<{ Variables: Variables; Bindings: Env }>();

  // Logging middleware
  app.use("*", async (c, next) => {
    try {
      const logger = createLogger(c.env);
      const requestId = crypto.randomUUID();
      const requestLogger = createRequestLogger(logger, requestId);
      c.set("requestId", requestId);
      c.set("logger", requestLogger);
      requestLogger.info(
        { method: c.req.method, path: c.req.path },
        "Request received"
      );
      await next();
    } catch (error) {
      console.error("Error in logging middleware:", error);
      throw error;
    }
  });

  // API root route
  app.get("/", (c) => {
    const logger = c.get("logger");
    logger.info(
      { headers: Object.fromEntries(c.req.raw.headers.entries()) },
      "Root route accessed"
    );
    return c.json({
      name: "Early Studies Headlines Fetcher API",
      version: "2.0.0",
    });
  });

  // Favicon route
  app.get("/favicon.ico", () => new Response(null, { status: 204 }));

  // Mount domain routers
  app.route("/headlines", headlinesRouter);
  app.route("/surveys", surveysRouter);
  app.route("/crm", crmRouter);

  // Global error handler
  app.onError((err, c) => {
    const logger = c.get("logger");
    let statusCode = 500;
    let errorPayload: z.infer<typeof StandardErrorSchema> = {
      message: "Internal Server Error",
      code: "INTERNAL_SERVER_ERROR",
    };

    if (err instanceof ZodError) {
      statusCode = 400;
      errorPayload = {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details: err.flatten(),
      };
      logger.warn(
        { path: c.req.path, method: c.req.method, errors: err.flatten() },
        "Validation error"
      );
    } else if (err instanceof HTTPException) {
      statusCode = err.status;
      errorPayload = { message: err.message, code: `HTTP_${statusCode}` };
      logger.error(
        { status: err.status, message: err.message, stack: err.stack },
        "HTTP exception"
      );
    } else if (err instanceof Error) {
      errorPayload = {
        message: err.message,
        code: "UNHANDLED_EXCEPTION",
        details: err.stack,
      };
      logger.error({ err }, "Unhandled application error");
    } else {
      errorPayload = {
        message: "An unknown error occurred",
        code: "UNKNOWN_ERROR",
        details: String(err),
      };
      logger.error({ error: err }, "Unknown error thrown");
    }

    c.status(statusCode as StatusCode);
    return c.json({
      data: null,
      success: false,
      error: errorPayload,
    });
  });

  return app;
}

// Export domain routers for direct access
export { headlinesRouter, surveysRouter, crmRouter };
