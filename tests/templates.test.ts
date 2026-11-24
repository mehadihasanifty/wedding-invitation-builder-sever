import { describe, expect, it } from "vitest";
import { memoryAdapter } from "better-auth/adapters/memory";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createAuth } from "../src/modules/auth/auth.js";
import { templateIdSchema, templateListQuerySchema, templatePreviewDataSchema, templatePreviewUrlSchema } from "../src/modules/templates/template.validation.js";
import { buildTemplateFilter } from "../src/modules/templates/template.service.js";

describe("template discovery validation and access", () => {
 it("defaults to newest-first pagination and normalizes color filters", () => {
  const parsed = templateListQuerySchema.parse({ page: "2", limit: "18", color: "#AABBCC", style: "botanical" });
  expect(parsed).toMatchObject({ page: 2, limit: 18, sort: "newest", color: "#aabbcc", style: "botanical" });
 });

 it("rejects unsafe filters, unknown query keys, and non-Cloudinary previews", () => {
  expect(templateListQuerySchema.safeParse({ page: "0" }).success).toBe(false);
  expect(templateListQuerySchema.safeParse({ style: "<script>" }).success).toBe(false);
  expect(templateListQuerySchema.safeParse({ category: "ceremony", userId: "untrusted" }).success).toBe(false);
  expect(templatePreviewUrlSchema.safeParse("https://example.com/invitation.jpg").success).toBe(false);
  expect(templatePreviewUrlSchema.safeParse("not-a-url").success).toBe(false);
  expect(templatePreviewUrlSchema.safeParse("https://res.cloudinary.com/everafter/image/upload/template.jpg").success).toBe(true);
  expect(templateIdSchema.safeParse("65f123456789012345678901").success).toBe(true);
  expect(templateIdSchema.safeParse("a-template-slug").success).toBe(false);
 });

 it("validates template-owned preview sections and capability metadata", () => {
  const valid = { previewSections: [{ key: "cover", title: "Invitation cover", description: "Names and event details on a botanical cover." }], designInfo: { layout: "Portrait editorial", headingFont: "Playfair Display", bodyFont: "Geist", motif: "Fine botanical linework" }, supportedCustomization: ["copy", "color-palette", "photos"] };
  expect(templatePreviewDataSchema.safeParse(valid).success).toBe(true);
  expect(templatePreviewDataSchema.safeParse({ ...valid, supportedCustomization: ["database-write"] }).success).toBe(false);
 });

 it("always scopes discovery to published templates and applies requested filters", () => {
  const query = templateListQuerySchema.parse({ q: "garden", category: "ceremony", style: "botanical", color: "#ffffff" });
  expect(buildTemplateFilter(query)).toEqual({
   status: "published", $text: { $search: "garden" }, category: "ceremony", styles: "botanical", colors: "#ffffff",
  });
 });

 it("requires an authenticated session before writing a favorite", async () => {
  const auth = createAuth(memoryAdapter({ user: [], session: [], account: [], verification: [] }));
  const response = await request(createApp(auth)).post("/api/templates/65f123456789012345678901/favorite");
  expect(response.status).toBe(401);
  expect(response.body.success).toBe(false);
 });

 it("resolves a template by stable ID and rejects malformed IDs before a database lookup", async () => {
  const auth = createAuth(memoryAdapter({ user: [], session: [], account: [], verification: [] }));
  const response = await request(createApp(auth)).get("/api/templates/by-id/not-an-object-id");
  expect(response.status).toBe(404);
 });
});
