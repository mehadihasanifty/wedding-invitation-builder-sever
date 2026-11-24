import type { Response } from "express";
export interface ApiEnvelope<T> { success: boolean; message: string; data?: T; errors?: unknown; meta: { timestamp: string; [key: string]: unknown } }
export function sendSuccess<T>(res: Response, message: string, data: T, statusCode = 200, metadata: Record<string, unknown> = {}) {
 return res.status(statusCode).json({ success: true, message, data, meta: { timestamp: new Date().toISOString(), ...metadata } } satisfies ApiEnvelope<T>);
}
export function sendError(res: Response, message: string, statusCode = 500, errors?: unknown) {
 return res.status(statusCode).json({ success: false, message, ...(errors === undefined ? {} : { errors }), meta: { timestamp: new Date().toISOString() } } satisfies ApiEnvelope<never>);
}
