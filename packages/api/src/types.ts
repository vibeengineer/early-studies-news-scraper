import { Logger } from 'pino';

/**
 * Global variables and types used in the application
 * Note: Env types come from worker-configuration.d.ts
 */
declare global {
  /**
   * Variables available in Hono context
   */
  interface Variables {
    requestId: string;
    logger: Logger;
  }
}

/**
 * Context variables available in handlers
 */
export type AppVariables = Variables;

/**
 * Full app context type for Hono
 */
export type AppContext = {
  Bindings: Env;
  Variables: AppVariables;
};

/**
 * Context for routes behind authMiddleware - user is guaranteed authenticated
 */
export type AuthenticatedAppContext = AppContext;

/**
 * Workflow parameters for processing a news item
 */
export type ProcessNewsItemParams = {
  headlineUrl: string;
  publicationId: string;
  headlineText: string;
  snippet: string | null;
  source: string;
  rawDate: string | null;
  normalizedDate: string | null;
};
