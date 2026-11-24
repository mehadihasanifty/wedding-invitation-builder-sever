import { z } from "zod";
import { TEMPLATE_CATEGORIES, TEMPLATE_CUSTOMIZATIONS, TEMPLATE_STYLES } from "./template.model.js";

export const templateListQuerySchema = z.object({
 q: z.string().trim().max(100).optional().transform((value) => value || undefined),
 category: z.enum(TEMPLATE_CATEGORIES).optional(),
 style: z.enum(TEMPLATE_STYLES).optional(),
 color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().transform((value) => value?.toLowerCase()),
 sort: z.enum(["newest", "popular"]).default("newest"),
 page: z.coerce.number().int().min(1).max(100_000).default(1),
 limit: z.coerce.number().int().min(1).max(36).default(12),
}).strict();

export const templateSlugSchema = z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const templateIdSchema = z.string().regex(/^[a-f\d]{24}$/i);
export const templatePreviewDataSchema = z.object({
 previewSections: z.array(z.object({ key: z.string().trim().min(1).max(48), title: z.string().trim().min(1).max(80), description: z.string().trim().min(1).max(240) }).strict()).min(1).max(12),
 designInfo: z.object({ layout: z.string().trim().min(1).max(80), headingFont: z.string().trim().min(1).max(80), bodyFont: z.string().trim().min(1).max(80), motif: z.string().trim().min(1).max(120) }).strict(),
 supportedCustomization: z.array(z.enum(TEMPLATE_CUSTOMIZATIONS)).min(1).max(TEMPLATE_CUSTOMIZATIONS.length),
}).strict();
export const templatePreviewUrlSchema = z.string().url().max(2048).refine((value) => {
 try {
  const preview = new URL(value);
  return preview.protocol === "https:" && preview.hostname === "res.cloudinary.com" && /^\/[a-zA-Z0-9_-]+\/image\/upload\/.+/.test(preview.pathname);
 } catch { return false; }
}, "Template previews must be stored in the Cloudinary image library.");

export type TemplateListQuery = z.infer<typeof templateListQuerySchema>;
