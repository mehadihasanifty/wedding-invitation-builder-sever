import type { RequestHandler } from "express";
import { fromNodeHeaders } from "better-auth/node";
import type { AuthInstance } from "../auth/auth.js";
import { sendError, sendSuccess } from "../../shared/api-response.js";
import { templateIdSchema, templateListQuerySchema, templateSlugSchema } from "./template.validation.js";
import { findPublishedTemplate, findPublishedTemplateById, listPublishedTemplates, listUserFavorites, removeTemplateFavorite, setTemplateFavorite } from "./template.service.js";

export function createTemplateController(auth: AuthInstance) {
 const getUserId = async (req: Parameters<RequestHandler>[0]) => (await auth.api.getSession({ headers: fromNodeHeaders(req.headers) }))?.user.id;
 const list: RequestHandler = async (req, res, next) => {
  try {
   const parsed = templateListQuerySchema.safeParse(req.query);
   if (!parsed.success) return sendError(res, "Template filters are invalid.", 400, parsed.error.flatten());
   const userId = await getUserId(req);
   const result = await listPublishedTemplates(parsed.data, userId);
   return sendSuccess(res, "Templates retrieved.", result.templates, 200, {
    pagination: result.pagination, facets: result.facets,
    sortOptions: result.sortOptions, appliedSort: result.appliedSort,
   });
  } catch (error) { return next(error); }
 };
 const detail: RequestHandler = async (req, res, next) => {
  try {
   const parsed = templateSlugSchema.safeParse(req.params.slug);
   if (!parsed.success) return sendError(res, "Template was not found.", 404);
   const userId = await getUserId(req);
   const template = await findPublishedTemplate(parsed.data, userId);
   if (!template) return sendError(res, "Template was not found.", 404);
   return sendSuccess(res, "Template retrieved.", template);
  } catch (error) { return next(error); }
 };
 const byId: RequestHandler = async (req, res, next) => {
  try {
   const parsed = templateIdSchema.safeParse(req.params.id);
   if (!parsed.success) return sendError(res, "Template was not found.", 404);
   const userId = await getUserId(req);
   const template = await findPublishedTemplateById(parsed.data, userId);
   if (!template) return sendError(res, "Template was not found.", 404);
   return sendSuccess(res, "Template retrieved.", template);
  } catch (error) { return next(error); }
 };
 const favorites: RequestHandler = async (req, res, next) => {
  try {
   const userId = req.authSession?.user.id;
   if (!userId) return sendError(res, "Authentication is required.", 401);
   return sendSuccess(res, "Saved templates retrieved.", await listUserFavorites(userId));
  } catch (error) { return next(error); }
 };
 const addFavorite: RequestHandler = async (req, res, next) => {
  try {
   const parsedId = templateIdSchema.safeParse(req.params.id);
   if (!parsedId.success) return sendError(res, "Template was not found.", 404);
   const userId = req.authSession?.user.id;
   if (!userId) return sendError(res, "Authentication is required.", 401);
   if (!await setTemplateFavorite(parsedId.data, userId)) return sendError(res, "Template was not found.", 404);
   return sendSuccess(res, "Template saved to your favorites.", { templateId: parsedId.data, isFavorite: true });
  } catch (error) { return next(error); }
 };
 const deleteFavorite: RequestHandler = async (req, res, next) => {
  try {
   const parsedId = templateIdSchema.safeParse(req.params.id);
   if (!parsedId.success) return sendError(res, "Template was not found.", 404);
   const userId = req.authSession?.user.id;
   if (!userId) return sendError(res, "Authentication is required.", 401);
   await removeTemplateFavorite(parsedId.data, userId);
   return sendSuccess(res, "Template removed from your favorites.", { templateId: parsedId.data, isFavorite: false });
  } catch (error) { return next(error); }
 };
 return { list, detail, byId, favorites, addFavorite, deleteFavorite };
}
