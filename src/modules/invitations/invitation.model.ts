import { model, Schema, Types } from "mongoose";
import type { InvitationDraftData } from "./invitation.validation.js";

export interface InvitationDraftRecord {
 ownerId: string;
 templateId: Types.ObjectId;
 data: InvitationDraftData;
 currentStep: number;
 status: "draft";
 createdAt?: Date;
 updatedAt?: Date;
}

const textField = (maxlength: number) => ({ type: String, trim: true, maxlength });

const brideSchema = new Schema({
 firstName: textField(80), lastName: textField(80), preferredName: textField(80), parents: textField(180),
}, { _id: false, strict: "throw" });
const groomSchema = new Schema({
 firstName: textField(80), lastName: textField(80), preferredName: textField(80), parents: textField(180),
}, { _id: false, strict: "throw" });
const familySchema = new Schema({
 hostLine: textField(240), brideFamily: textField(240), groomFamily: textField(240),
}, { _id: false, strict: "throw" });
const dateTimeSchema = new Schema({
 weddingDate: textField(10), weddingTime: textField(5), timeZone: textField(80),
}, { _id: false, strict: "throw" });
const eventSchema = new Schema({
 title: textField(100), date: textField(10), time: textField(5), venueName: textField(120), address: textField(240),
}, { _id: false, strict: "throw" });
const eventScheduleSchema = new Schema({ events: { type: [eventSchema], default: [], maxlength: 20 } }, { _id: false, strict: "throw" });
const venueSchema = new Schema({
 name: textField(140), addressLine1: textField(180), addressLine2: textField(180), city: textField(100),
 region: textField(100), postalCode: textField(24), country: textField(100), mapUrl: textField(2048),
}, { _id: false, strict: "throw" });
const messageSchema = new Schema({ headline: textField(140), body: textField(3000) }, { _id: false, strict: "throw" });
const photoSchema = new Schema({ url: textField(2048), altText: textField(160), caption: textField(180) }, { _id: false, strict: "throw" });
const gallerySchema = new Schema({ photos: { type: [photoSchema], default: [], maxlength: 30 } }, { _id: false, strict: "throw" });
const musicSchema = new Schema({ trackTitle: textField(120), trackUrl: textField(2048) }, { _id: false, strict: "throw" });
const additionalDetailsSchema = new Schema({
 dressCode: textField(160), giftNote: textField(500), accommodation: textField(800), parking: textField(500), otherNotes: textField(1200),
}, { _id: false, strict: "throw" });

const invitationDataSchema = new Schema({
 bride: { type: brideSchema, required: true },
 groom: { type: groomSchema, required: true },
 family: { type: familySchema, required: true },
 dateTime: { type: dateTimeSchema, required: true },
 eventSchedule: { type: eventScheduleSchema, required: true },
 venue: { type: venueSchema, required: true },
 message: { type: messageSchema, required: true },
 gallery: { type: gallerySchema, required: true },
 music: { type: musicSchema, required: true },
 additionalDetails: { type: additionalDetailsSchema, required: true },
}, { _id: false, strict: "throw" });

const invitationDraftSchema = new Schema<InvitationDraftRecord>({
 ownerId: { type: String, required: true, immutable: true },
 templateId: { type: Schema.Types.ObjectId, ref: "Template", required: true, immutable: true },
 data: { type: invitationDataSchema, required: true },
 currentStep: { type: Number, required: true, min: 0, max: 9, default: 0 },
 status: { type: String, enum: ["draft"], required: true, default: "draft" },
}, { timestamps: true, strict: "throw" });

invitationDraftSchema.index({ ownerId: 1, updatedAt: -1 }, { name: "owner_drafts_recent" });
invitationDraftSchema.index({ templateId: 1, status: 1 }, { name: "template_drafts_status" });

export const InvitationDraftModel = model<InvitationDraftRecord>("InvitationDraft", invitationDraftSchema);
