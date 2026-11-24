import { Router } from "express";
import { isDatabaseConnected } from "../../config/database.js";
import { sendSuccess } from "../../shared/api-response.js";
export const healthRouter = Router();
healthRouter.get("/", (_req, res) => {
 const connected = isDatabaseConnected();
 sendSuccess(res, connected ? "Service is healthy." : "Service is starting or database is unavailable.", {
  status: connected ? "ok" : "degraded",
  database: connected ? "connected" : "disconnected",
  timestamp: new Date().toISOString(),
 }, connected ? 200 : 503);
});
