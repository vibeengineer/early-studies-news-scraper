import { Hono } from 'hono';

// Create a router for the crm domain
const crmRouter = new Hono<{ Variables: Variables; Bindings: Env }>();

// TODO: Add crm routes here

export default crmRouter;
