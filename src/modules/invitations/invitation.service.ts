import mongoose, { Types } from "mongoose";
import { TemplateModel } from "../templates/template.model.js";
import { InvitationDraftModel, type InvitationDraftRecord } from "./invitation.model.js";
import type { InvitationDraftData } from "./invitation.validation.js";

export interface InvitationDraftView {
 id: string;
 templateId: string;
 data: InvitationDraftData;
 currentStep: number;
 status: "draft";
 updatedAt: string;
}

type PersistedDraft = Pick<InvitationDraftRecord, "templateId" | "data" | "currentStep" | "status" | "updatedAt"> & { _id: Types.ObjectId };

function toDraftView(draft: PersistedDraft): InvitationDraftView {
 return {
  id: draft._id.toString(), templateId: draft.templateId.toString(),
  data: draft.data, currentStep: draft.currentStep, status: draft.status,
  updatedAt: draft.updatedAt?.toISOString() ?? new Date().toISOString(),
 };
}

export function buildOwnedDraftFilter(ownerId: string, draftId: string): mongoose.QueryFilter<InvitationDraftRecord> {
 return { _id: draftId, ownerId, status: "draft" };
}

export async function createInvitationDraft(ownerId: string, input: { templateId: string; data: InvitationDraftData; currentStep: number }) {
 const template = await TemplateModel.exists({ _id: input.templateId, status: "published" });
 if (!template) return null;
 const draft = await InvitationDraftModel.create({
  ownerId,
  templateId: new Types.ObjectId(input.templateId),
  data: input.data,
  currentStep: input.currentStep,
  status: "draft",
 });
 return toDraftView(draft);
}

export async function findOwnedInvitationDraft(ownerId: string, draftId: string) {
 const draft = await InvitationDraftModel.findOne(buildOwnedDraftFilter(ownerId, draftId)).lean();
 return draft ? toDraftView(draft) : null;
}

export async function updateOwnedInvitationDraft(ownerId: string, draftId: string, input: { data: InvitationDraftData; currentStep: number }) {
 const draft = await InvitationDraftModel.findOneAndUpdate(
  buildOwnedDraftFilter(ownerId, draftId),
  { $set: { data: input.data, currentStep: input.currentStep } },
  { new: true, runValidators: true },
 ).lean();
 return draft ? toDraftView(draft) : null;
}
