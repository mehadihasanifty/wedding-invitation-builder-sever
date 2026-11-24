import { createServer } from "node:http";
import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import mongoose from "mongoose";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { createAuth } from "./modules/auth/auth.js";
let server: ReturnType<typeof createServer> | undefined;
async function start() {
 await connectDatabase();
 const database = mongoose.connection.db;
 if (!database) throw new Error("MongoDB connection did not expose a database.");
 const topology = await database.admin().command({ hello: 1 }) as { setName?: unknown; msg?: unknown };
 const supportsTransactions = typeof topology.setName === "string" || topology.msg === "isdbgrid";
 const auth = createAuth(mongodbAdapter(database, {
  client: mongoose.connection.getClient(),
  transaction: supportsTransactions,
 }));
 server = createServer(createApp(auth));
 server.listen(env.PORT, () => console.log(`API server listening at http://localhost:${env.PORT}`));
}
async function shutdown(signal: string) {
 console.log(`${signal} received; shutting down gracefully.`);
 server?.close(async error => {
  if (error) { console.error("Failed to close HTTP server cleanly.", error); process.exitCode = 1; }
  try { await disconnectDatabase(); } finally { process.exit(); }
 });
}
process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
start().catch(async (error: unknown) => {
 console.error("Server startup failed:", error);
 await disconnectDatabase().catch(() => undefined);
 process.exitCode = 1;
});
