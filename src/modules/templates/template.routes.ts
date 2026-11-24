import { Router } from "express";
import type { AuthInstance } from "../auth/auth.js";
import { createRequireAuth } from "../../middlewares/require-auth.js";
import { createTemplateController } from "./template.controller.js";

export function createTemplateRouter(auth: AuthInstance) {
 const router = Router();
 const controller = createTemplateController(auth);
 const requireAuth = createRequireAuth(auth);
 router.get("/", controller.list);
 router.get("/by-id/:id", controller.byId);
 router.get("/favorites", requireAuth, controller.favorites);
 router.post("/:id/favorite", requireAuth, controller.addFavorite);
 router.delete("/:id/favorite", requireAuth, controller.deleteFavorite);
 router.get("/:slug", controller.detail);
 return router;
}
