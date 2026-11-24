import type { RequestHandler } from "express";
import { fromNodeHeaders } from "better-auth/node";
import type { AuthInstance, AuthSession } from "../modules/auth/auth.js";

declare global {
 namespace Express {
  interface Request { authSession?: AuthSession }
 }
}

export function createRequireAuth(auth: AuthInstance): RequestHandler {
 return async (req, res, next) => {
  try {
   const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
   if (!session) {
    res.status(401).json({ success: false, message: "Authentication is required.", meta: { timestamp: new Date().toISOString() } });
    return;
   }
   req.authSession = session;
   next();
  } catch (error) { next(error); }
 };
}
