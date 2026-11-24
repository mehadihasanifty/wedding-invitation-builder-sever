import { describe, expect, it } from "vitest";
import { memoryAdapter } from "better-auth/adapters/memory";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createAuth } from "../src/modules/auth/auth.js";
import { InvitationDraftModel } from "../src/modules/invitations/invitation.model.js";
import { buildOwnedDraftFilter } from "../src/modules/invitations/invitation.service.js";
import { createInvitationDraftSchema, invitationDraftDataSchema } from "../src/modules/invitations/invitation.validation.js";

const blankDraftData = {
 bride: { firstName: "", lastName: "", preferredName: "", parents: "" },
 groom: { firstName: "", lastName: "", preferredName: "", parents: "" },
 family: { hostLine: "", brideFamily: "", groomFamily: "" },
 dateTime: { weddingDate: "", weddingTime: "", timeZone: "" },
 eventSchedule: { events: [] },
 venue: { name: "", addressLine1: "", addressLine2: "", city: "", region: "", postalCode: "", country: "", mapUrl: "" },
 message: { headline: "", body: "" },
 gallery: { photos: [] },
 music: { trackTitle: "", trackUrl: "" },
 additionalDetails: { dressCode: "", giftNote: "", accommodation: "", parking: "", otherNotes: "" },
};

describe("invitation draft foundation", () => {
 it("accepts a complete but intentionally unfinished draft shape", () => {
  const parsed = createInvitationDraftSchema.parse({ templateId: "65f123456789012345678901", currentStep: 0, data: blankDraftData });
  expect(parsed.data).toEqual(blankDraftData);
 });

 it("validates the structured Mongoose draft document without saving it", async () => {
  const draft = new InvitationDraftModel({ ownerId: "authenticated-user", templateId: "65f123456789012345678901", data: blankDraftData, currentStep: 0, status: "draft" });
  await expect(draft.validate()).resolves.toBeUndefined();
  expect(draft.data.bride.firstName).toBe("");
 });

 it("rejects invalid dates, unsafe media URLs, and client-supplied ownership", () => {
  expect(invitationDraftDataSchema.safeParse({ ...blankDraftData, dateTime: { ...blankDraftData.dateTime, weddingDate: "2026-02-31" } }).success).toBe(false);
  expect(invitationDraftDataSchema.safeParse({ ...blankDraftData, gallery: { photos: [{ url: "https://example.com/photo.jpg", altText: "", caption: "" }] } }).success).toBe(false);
  expect(createInvitationDraftSchema.safeParse({ templateId: "65f123456789012345678901", currentStep: 0, data: blankDraftData, ownerId: "another-user" }).success).toBe(false);
 });

 it("scopes draft queries to the authenticated owner and draft ID", () => {
  expect(buildOwnedDraftFilter("authenticated-user", "65f123456789012345678901")).toEqual({ _id: "65f123456789012345678901", ownerId: "authenticated-user", status: "draft" });
 });

 it("requires authentication before draft endpoints can be used", async () => {
  const auth = createAuth(memoryAdapter({ user: [], session: [], account: [], verification: [] }));
  const response = await request(createApp(auth)).post("/api/invitations/drafts").send({ templateId: "65f123456789012345678901", currentStep: 0, data: blankDraftData });
  expect(response.status).toBe(401);
 });

 it("rejects an ownership override from an authenticated client before persistence", async () => {
  const auth = createAuth(memoryAdapter({ user: [], session: [], account: [], verification: [] }));
  const app = createApp(auth);
  const agent = request.agent(app);
  const email = `draft-owner-${Date.now()}@example.test`;
  await agent.post("/api/auth/sign-up/email").send({ name: "Draft Owner", email, password: "Draft-owner-password-2026" });
  const response = await agent.post("/api/invitations/drafts").send({ templateId: "65f123456789012345678901", currentStep: 0, data: blankDraftData, ownerId: "another-user" });
  expect(response.status).toBe(400);
  expect(response.body.success).toBe(false);
 });
});
