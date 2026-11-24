import cors from "cors";
import express from "express";
import helmet from "helmet";
import type { BetterAuthOptions } from "better-auth";
import { toNodeHandler } from "better-auth/node";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler.js";
import { createAuth } from "./modules/auth/auth.js";
import { createRequireAuth } from "./middlewares/require-auth.js";
import { createUsersRouter } from "./modules/users/users.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { passwordRecoveryEnabled } from "./config/env.js";
import { sendSuccess } from "./shared/api-response.js";
import { createTemplateRouter } from "./modules/templates/template.routes.js";
import { createInvitationRouter } from "./modules/invitations/invitation.routes.js";

export function createApp(auth: ReturnType<typeof createAuth>) {
 const app = express();
 app.disable("x-powered-by");
 app.use(helmet());
 app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
 app.options("/{*splat}", cors({ origin: env.CLIENT_ORIGIN, credentials: true }));

 app.get("/api/auth/config", (_req, res) => sendSuccess(res, "Authentication configuration retrieved.", { passwordRecoveryEnabled }));

 // Better Auth needs the raw request body, so mount this before express.json().
 app.all("/api/auth/*splat", toNodeHandler(auth));
 app.use(express.json({ limit: "1mb" }));
 app.use("/api/users", createUsersRouter(auth, createRequireAuth(auth)));
 app.use("/api/templates", createTemplateRouter(auth));
 app.use("/api/invitations", createInvitationRouter(auth));
 app.use("/api/health", healthRouter);
 app.use(notFoundHandler);
 app.use(errorHandler);
 return app;
}
