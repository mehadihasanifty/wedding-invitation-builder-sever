import { model, Schema, type InferSchemaType } from "mongoose";

export const TEMPLATE_CATEGORIES = ["ceremony", "reception", "save-the-date", "wedding-weekend", "elopement"] as const;
export const TEMPLATE_STYLES = ["botanical", "classic", "modern", "minimal", "editorial", "romantic", "vintage", "destination", "rustic"] as const;
export const TEMPLATE_CUSTOMIZATIONS = ["copy", "color-palette", "typography", "photos", "section-visibility", "section-order"] as const;

const templateSchema = new Schema({
 name: { type: String, required: true, trim: true, maxlength: 100 },
 slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
 description: { type: String, required: true, trim: true, maxlength: 500 },
 category: { type: String, enum: TEMPLATE_CATEGORIES, required: true },
 styles: { type: [{ type: String, enum: TEMPLATE_STYLES }], required: true, validate: { validator: (value: string[]) => value.length > 0 && value.length <= 5 } },
 colors: { type: [{ type: String, match: /^#[0-9a-fA-F]{6}$/ }], required: true, validate: { validator: (value: string[]) => value.length > 0 && value.length <= 6 } },
 tags: { type: [{ type: String, trim: true, lowercase: true, maxlength: 32 }], default: [] },
 previewImageUrl: { type: String, required: true, trim: true, validate: { validator: (value: string) => { try { const preview = new URL(value); return preview.protocol === "https:" && preview.hostname === "res.cloudinary.com" && /^\/[a-zA-Z0-9_-]+\/image\/upload\/.+/.test(preview.pathname); } catch { return false; } }, message: "Template preview image must use the Cloudinary image library." } },
 previewSections: { type: [{ key: { type: String, required: true, trim: true, lowercase: true, maxlength: 48 }, title: { type: String, required: true, trim: true, maxlength: 80 }, description: { type: String, required: true, trim: true, maxlength: 240 } }], required: true, validate: { validator: (value: unknown[]) => value.length > 0 && value.length <= 12 } },
 designInfo: { type: new Schema({ layout: { type: String, required: true, trim: true, maxlength: 80 }, headingFont: { type: String, required: true, trim: true, maxlength: 80 }, bodyFont: { type: String, required: true, trim: true, maxlength: 80 }, motif: { type: String, required: true, trim: true, maxlength: 120 } }, { _id: false, strict: "throw" }), required: true },
 supportedCustomization: { type: [{ type: String, enum: TEMPLATE_CUSTOMIZATIONS }], required: true, validate: { validator: (value: string[]) => value.length > 0 && value.length <= TEMPLATE_CUSTOMIZATIONS.length } },
 status: { type: String, enum: ["draft", "published", "archived"], default: "draft", required: true },
 popularityCount: { type: Number, default: 0, min: 0, validate: Number.isInteger },
 publishedAt: { type: Date, default: null },
}, { timestamps: true, strict: "throw" });

templateSchema.index({ slug: 1 }, { unique: true, name: "template_slug_unique" });
templateSchema.index({ status: 1, publishedAt: -1, _id: -1 }, { name: "published_templates_newest" });
templateSchema.index({ status: 1, category: 1, publishedAt: -1 }, { name: "published_templates_category" });
templateSchema.index({ status: 1, styles: 1, publishedAt: -1 }, { name: "published_templates_style" });
templateSchema.index({ status: 1, colors: 1, publishedAt: -1 }, { name: "published_templates_color" });
templateSchema.index({ status: 1, popularityCount: -1, publishedAt: -1, _id: -1 }, { name: "published_templates_popular" });
templateSchema.index({ name: "text", description: "text", tags: "text" }, { weights: { name: 10, tags: 4, description: 2 }, name: "template_catalog_search" });

export type TemplateRecord = InferSchemaType<typeof templateSchema>;
export const TemplateModel = model("Template", templateSchema);

const templateFavoriteSchema = new Schema({
 userId: { type: String, required: true },
 templateId: { type: Schema.Types.ObjectId, ref: "Template", required: true },
}, { timestamps: { createdAt: true, updatedAt: false }, strict: "throw" });

templateFavoriteSchema.index({ userId: 1, templateId: 1 }, { unique: true, name: "user_template_favorite_unique" });
templateFavoriteSchema.index({ userId: 1, createdAt: -1 }, { name: "user_template_favorites_recent" });

export const TemplateFavoriteModel = model("TemplateFavorite", templateFavoriteSchema);
