import { createAppRouter } from './routes';

/**
 * Main application export for Cloudflare Workers
 */
export default {
  fetch: createAppRouter().fetch,
};
