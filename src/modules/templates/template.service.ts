import mongoose, { Types } from "mongoose";
import { TemplateFavoriteModel, TemplateModel, type TemplateRecord } from "./template.model.js";
import type { TemplateListQuery } from "./template.validation.js";

export interface TemplateCardData {
 id: string;
 name: string;
 slug: string;
 description: string;
 category: string;
 styles: string[];
 colors: string[];
 tags: string[];
 previewImageUrl: string;
 previewSections: { key: string; title: string; description: string }[];
 designInfo: { layout: string; headingFont: string; bodyFont: string; motif: string };
 supportedCustomization: string[];
 publishedAt: string;
 popularityCount: number;
 isFavorite: boolean;
}

function toTemplateCard(record: TemplateRecord & { _id: Types.ObjectId }, isFavorite: boolean): TemplateCardData {
 return {
  id: record._id.toString(), name: record.name, slug: record.slug,
  description: record.description, category: record.category,
  styles: record.styles, colors: record.colors, tags: record.tags,
  previewImageUrl: record.previewImageUrl, previewSections: record.previewSections,
  designInfo: record.designInfo, supportedCustomization: record.supportedCustomization,
  publishedAt: record.publishedAt?.toISOString() ?? record.createdAt.toISOString(),
  popularityCount: record.popularityCount, isFavorite,
 };
}

export function buildTemplateFilter(query: Pick<TemplateListQuery, "q" | "category" | "style" | "color">): mongoose.QueryFilter<TemplateRecord> {
 const filter: mongoose.QueryFilter<TemplateRecord> = { status: "published" };
 if (query.q) filter.$text = { $search: query.q };
 if (query.category) filter.category = query.category;
 if (query.style) filter.styles = query.style;
 if (query.color) filter.colors = query.color;
 return filter;
}

export async function listPublishedTemplates(query: TemplateListQuery, userId?: string) {
 const filter = buildTemplateFilter(query);
 const [total, hasPopularity, categories, styles, colors] = await Promise.all([
  TemplateModel.countDocuments(filter),
  TemplateModel.exists({ status: "published", popularityCount: { $gt: 0 } }),
  TemplateModel.distinct("category", { status: "published" }),
  TemplateModel.distinct("styles", { status: "published" }),
  TemplateModel.distinct("colors", { status: "published" }),
 ]);
 const effectiveSort: Record<string, 1 | -1> = query.sort === "popular" && hasPopularity
  ? { popularityCount: -1, publishedAt: -1, _id: -1 }
  : { publishedAt: -1, _id: -1 };
 const pageCount = Math.ceil(total / query.limit);
 const records = await TemplateModel.find(filter)
  .sort(effectiveSort)
  .skip((query.page - 1) * query.limit)
  .limit(query.limit)
  .lean();
 const favoriteIds = userId && records.length > 0
  ? await TemplateFavoriteModel.find({ userId, templateId: { $in: records.map((record) => record._id) } }).distinct("templateId")
  : [];
 const favoriteSet = new Set(favoriteIds.map((id) => id.toString()));
 return {
  templates: records.map((record) => toTemplateCard(record, favoriteSet.has(record._id.toString()))),
  pagination: {
   page: query.page, limit: query.limit, total, pages: pageCount,
   hasNextPage: query.page < pageCount, hasPreviousPage: query.page > 1 && pageCount > 0,
  },
  facets: {
   categories: categories.map(String).sort(),
   styles: styles.map(String).sort(),
   colors: colors.map((color) => String(color).toLowerCase()).sort(),
  },
  sortOptions: { newest: true, popular: Boolean(hasPopularity) },
  appliedSort: query.sort === "popular" && hasPopularity ? "popular" : "newest",
 };
}

export async function findPublishedTemplate(slug: string, userId?: string) {
 const record = await TemplateModel.findOne({ slug, status: "published" }).lean();
 if (!record) return null;
 const isFavorite = userId
  ? Boolean(await TemplateFavoriteModel.exists({ userId, templateId: record._id }))
  : false;
 return toTemplateCard(record, isFavorite);
}

export async function findPublishedTemplateById(id: string, userId?: string) {
 const record = await TemplateModel.findOne({ _id: id, status: "published" }).lean();
 if (!record) return null;
 const isFavorite = userId
  ? Boolean(await TemplateFavoriteModel.exists({ userId, templateId: record._id }))
  : false;
 return toTemplateCard(record, isFavorite);
}

export async function listUserFavorites(userId: string) {
 const favorites = await TemplateFavoriteModel.find({ userId }).sort({ createdAt: -1 }).select("templateId").lean();
 if (favorites.length === 0) return [];
 const ids = favorites.map((favorite) => favorite.templateId);
 const records = await TemplateModel.find({ _id: { $in: ids }, status: "published" }).lean();
 const byId = new Map(records.map((record) => [record._id.toString(), record]));
 return ids.flatMap((id) => {
  const record = byId.get(id.toString());
  return record ? [toTemplateCard(record, true)] : [];
 });
}

export async function setTemplateFavorite(templateId: string, userId: string) {
 const templateExists = await TemplateModel.exists({ _id: templateId, status: "published" });
 if (!templateExists) return false;
 try {
  await TemplateFavoriteModel.updateOne(
   { userId, templateId: new Types.ObjectId(templateId) },
   { $setOnInsert: { userId, templateId: new Types.ObjectId(templateId) } },
   { upsert: true },
  );
 } catch (error) {
  if (!(typeof error === "object" && error !== null && "code" in error && error.code === 11000)) throw error;
 }
 return true;
}

export async function removeTemplateFavorite(templateId: string, userId: string) {
 await TemplateFavoriteModel.deleteOne({ userId, templateId: new Types.ObjectId(templateId) });
}
