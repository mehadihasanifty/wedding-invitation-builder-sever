import { Router } from "express";
import { z } from "zod";
import { fromNodeHeaders } from "better-auth/node";
import type { AuthInstance } from "../auth/auth.js";
import { sendError, sendSuccess } from "../../shared/api-response.js";

const profileSchema = z.object({
 name: z.string().trim().min(1).max(100),
 image: z.union([z.string().url().max(2048), z.null()]).optional(),
}).strict();

export function createUsersRouter(auth: AuthInstance, requireAuth: import("express").RequestHandler) {
 const router = Router();
 router.use(requireAuth);
 router.get("/me", (req, res) => {
  const user = req.authSession?.user;
  if (!user) return sendError(res, "Authentication is required.", 401);
  return sendSuccess(res, "Profile retrieved.", { id: user.id, name: user.name, email: user.email, image: user.image ?? null, emailVerified: user.emailVerified });
 });
 router.patch("/me", async (req, res, next) => {
  try {
   const parsed = profileSchema.safeParse(req.body);
   if (!parsed.success) return sendError(res, "Profile details are invalid.", 400, parsed.error.flatten());
   await auth.api.updateUser({ headers: fromNodeHeaders(req.headers), body: parsed.data });
   const updatedSession = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
   const user = updatedSession?.user;
   if (!user) return sendError(res, "Session expired. Please sign in again.", 401);
   return sendSuccess(res, "Profile updated.", { id: user.id, name: user.name, email: user.email, image: user.image ?? null, emailVerified: user.emailVerified });
  } catch (error) { return next(error); }
 });
 return router;
}
