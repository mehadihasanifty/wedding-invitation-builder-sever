import type { ErrorRequestHandler, RequestHandler } from "express";
import { sendError } from "../shared/api-response.js";
export const notFoundHandler: RequestHandler = (_req, res) => { sendError(res, "Route not found.", 404); };
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
 if (res.headersSent) return;
 const status = typeof error?.status === "number" && error.status >= 400 && error.status < 600 ? error.status : 500;
 const message = status >= 500 && process.env.NODE_ENV === "production" ? "An unexpected server error occurred." : error instanceof Error ? error.message : "An unexpected server error occurred.";
 sendError(res, message, status);
};
