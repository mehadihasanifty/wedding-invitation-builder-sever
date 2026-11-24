import { z } from "zod";
import { templateIdSchema } from "../templates/template.validation.js";

const limitedText = (max: number) => z.string().trim().max(max);
const validDate = z.string().refine((value) => {
 if (value === "") return true;
 if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
 const parsed = new Date(`${value}T00:00:00.000Z`);
 return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "Enter a real calendar date.");
const validTime = z.string().refine((value) => value === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(value), "Enter a valid time.");
const cloudinaryImageUrl = limitedText(2048).refine((value) => {
 if (value === "") return true;
 try {
  const url = new URL(value);
  return url.protocol === "https:" && url.hostname === "res.cloudinary.com" && /^\/[a-zA-Z0-9_-]+\/image\/upload\/.+/.test(url.pathname);
 } catch { return false; }
}, "Use a Cloudinary image URL or leave this field blank.");
const cloudinaryAudioUrl = limitedText(2048).refine((value) => {
 if (value === "") return true;
 try {
  const url = new URL(value);
  return url.protocol === "https:" && url.hostname === "res.cloudinary.com" && /^\/[a-zA-Z0-9_-]+\/(?:video|raw)\/upload\/.+/.test(url.pathname);
 } catch { return false; }
}, "Use a Cloudinary audio URL or leave this field blank.");
const webUrl = limitedText(2048).refine((value) => {
 if (value === "") return true;
 try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; }
 catch { return false; }
}, "Enter a valid web URL or leave this field blank.");

export const invitationDraftDataSchema = z.object({
 bride: z.object({ firstName: limitedText(80), lastName: limitedText(80), preferredName: limitedText(80), parents: limitedText(180) }).strict(),
 groom: z.object({ firstName: limitedText(80), lastName: limitedText(80), preferredName: limitedText(80), parents: limitedText(180) }).strict(),
 family: z.object({ hostLine: limitedText(240), brideFamily: limitedText(240), groomFamily: limitedText(240) }).strict(),
 dateTime: z.object({ weddingDate: validDate, weddingTime: validTime, timeZone: limitedText(80) }).strict(),
 eventSchedule: z.object({ events: z.array(z.object({ title: limitedText(100), date: validDate, time: validTime, venueName: limitedText(120), address: limitedText(240) }).strict()).max(20) }).strict(),
 venue: z.object({ name: limitedText(140), addressLine1: limitedText(180), addressLine2: limitedText(180), city: limitedText(100), region: limitedText(100), postalCode: limitedText(24), country: limitedText(100), mapUrl: webUrl }).strict(),
 message: z.object({ headline: limitedText(140), body: limitedText(3000) }).strict(),
 gallery: z.object({ photos: z.array(z.object({ url: cloudinaryImageUrl.refine(Boolean, "A photo URL is required for each gallery item."), altText: limitedText(160), caption: limitedText(180) }).strict()).max(30) }).strict(),
 music: z.object({ trackTitle: limitedText(120), trackUrl: cloudinaryAudioUrl }).strict(),
 additionalDetails: z.object({ dressCode: limitedText(160), giftNote: limitedText(500), accommodation: limitedText(800), parking: limitedText(500), otherNotes: limitedText(1200) }).strict(),
}).strict();

export const createInvitationDraftSchema = z.object({
 templateId: templateIdSchema,
 data: invitationDraftDataSchema,
 currentStep: z.number().int().min(0).max(9),
}).strict();

export const updateInvitationDraftSchema = z.object({
 data: invitationDraftDataSchema,
 currentStep: z.number().int().min(0).max(9),
}).strict();

export const invitationDraftIdSchema = templateIdSchema;
export type InvitationDraftData = z.infer<typeof invitationDraftDataSchema>;
