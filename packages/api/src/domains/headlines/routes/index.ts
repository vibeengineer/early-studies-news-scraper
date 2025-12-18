import { Hono } from 'hono';
import { authMiddleware } from '../../middleware';

// Route handlers
import { deletePublicationHandler } from './publications/by-id/delete';
import { getPublicationsHandler } from './publications/query/get';
import { createPublicationHandler } from './publications/post';
import { fetchHeadlinesHandler } from './fetch/post';

// Create a router for the headlines domain
const headlinesRouter = new Hono<{ Variables: Variables; Bindings: Env }>();

// Headlines routes
headlinesRouter.post('/fetch', authMiddleware, fetchHeadlinesHandler);

// Publications routes
headlinesRouter.post('/publications/query', authMiddleware, getPublicationsHandler);
headlinesRouter.post('/publications', authMiddleware, createPublicationHandler);
headlinesRouter.delete('/publications', authMiddleware, deletePublicationHandler);

export default headlinesRouter;
