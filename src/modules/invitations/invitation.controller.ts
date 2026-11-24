import type { RequestHandler } from "express";
import { sendError, sendSuccess } from "../../shared/api-response.js";
import { createInvitationDraftSchema, invitationDraftIdSchema, updateInvitationDraftSchema } from "./invitation.validation.js";
import { createInvitationDraft, findOwnedInvitationDraft, updateOwnedInvitationDraft } from "./invitation.service.js";

export const createDraft: RequestHandler = async (req, res, next) => {
 try {
  const parsed = createInvitationDraftSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, "Draft details are invalid.", 400, parsed.error.flatten());
  const ownerId = req.authSession?.user.id;
  if (!ownerId) return sendError(res, "Authentication is required.", 401);
  const draft = await createInvitationDraft(ownerId, parsed.data);
  if (!draft) return sendError(res, "The selected template is not available.", 404);
  return sendSuccess(res, "Invitation draft saved.", draft, 201);
 } catch (error) { return next(error); }
};

export const getDraft: RequestHandler = async (req, res, next) => {
 try {
  const parsedId = invitationDraftIdSchema.safeParse(req.params.id);
  if (!parsedId.success) return sendError(res, "Draft was not found.", 404);
  const ownerId = req.authSession?.user.id;
  if (!ownerId) return sendError(res, "Authentication is required.", 401);
  const draft = await findOwnedInvitationDraft(ownerId, parsedId.data);
  if (!draft) return sendError(res, "Draft was not found.", 404);
  return sendSuccess(res, "Invitation draft retrieved.", draft);
 } catch (error) { return next(error); }
};

export const updateDraft: RequestHandler = async (req, res, next) => {
 try {
  const parsedId = invitationDraftIdSchema.safeParse(req.params.id);
  if (!parsedId.success) return sendError(res, "Draft was not found.", 404);
  const parsedBody = updateInvitationDraftSchema.safeParse(req.body);
  if (!parsedBody.success) return sendError(res, "Draft details are invalid.", 400, parsedBody.error.flatten());
  const ownerId = req.authSession?.user.id;
  if (!ownerId) return sendError(res, "Authentication is required.", 401);
  const draft = await updateOwnedInvitationDraft(ownerId, parsedId.data, parsedBody.data);
  if (!draft) return sendError(res, "Draft was not found.", 404);
  return sendSuccess(res, "Invitation draft updated.", draft);
 } catch (error) { return next(error); }
};
