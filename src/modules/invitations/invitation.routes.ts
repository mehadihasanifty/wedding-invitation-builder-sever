import { Router } from "express";
import type { AuthInstance } from "../auth/auth.js";
import { createRequireAuth } from "../../middlewares/require-auth.js";
import { createDraft, getDraft, updateDraft } from "./invitation.controller.js";

export function createInvitationRouter(auth: AuthInstance) {
 const router = Router();
 router.use(createRequireAuth(auth));
 router.post("/drafts", createDraft);
 router.get("/drafts/:id", getDraft);
 router.put("/drafts/:id", updateDraft);
 return router;
}
