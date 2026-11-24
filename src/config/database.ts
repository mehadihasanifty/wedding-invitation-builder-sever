import mongoose from "mongoose";
import { env } from "./env.js";
export async function connectDatabase() {
 mongoose.set("strictQuery", true);
 await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
}
export async function disconnectDatabase() {
 if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}
export function isDatabaseConnected() { return mongoose.connection.readyState === 1; }
