import { Hono } from "hono";

// Create a router for the surveys domain
const surveysRouter = new Hono<{ Variables: Variables; Bindings: Env }>();

// TODO: Add survey routes here

export default surveysRouter;
