import { beforeEach, describe, expect, it } from "vitest";
import { memoryAdapter } from "better-auth/adapters/memory";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createAuth } from "../src/modules/auth/auth.js";

describe("Better Auth and protected profile API", () => {
 const testDatabase = { user: [], session: [], account: [], verification: [] };
 const app = createApp(createAuth(memoryAdapter(testDatabase)));
 const agent = request.agent(app);
 const email = `phase04-${Date.now()}@example.test`;
 const password = "Wedding-test-password-2026";

 beforeEach(async () => {
  await agent.post("/api/auth/sign-out");
 });

 it("rejects profile access without an authenticated session", async () => {
  const response = await request(app).get("/api/users/me");
  expect(response.status).toBe(401);
  expect(response.body.success).toBe(false);
 });

 it("registers, keeps a session across requests, updates only the signed-in profile, logs out and allows login", async () => {
  const unauthenticated = await agent.get("/api/auth/get-session");
  expect(unauthenticated.status).toBe(200);
  expect(unauthenticated.body).toBeNull();

  const registration = await agent.post("/api/auth/sign-up/email").send({ name: "Avery Example", email, password });
  expect(registration.status).toBe(200);
  expect(registration.body.user.email).toBe(email);

  const persisted = await agent.get("/api/auth/get-session");
  expect(persisted.body.user.email).toBe(email);
  const profile = await agent.get("/api/users/me");
  expect(profile.status).toBe(200);
  expect(profile.body.data).toMatchObject({ email, name: "Avery Example" });

  const changed = await agent.patch("/api/users/me").send({ name: "Avery Updated", userId: "attacker-selected-id" });
  expect(changed.status).toBe(400);
  const updated = await agent.patch("/api/users/me").send({ name: "Avery Updated" });
  expect(updated.status).toBe(200);
  expect(updated.body.data).toMatchObject({ email, name: "Avery Updated" });

  const logout = await agent.post("/api/auth/sign-out");
  expect(logout.status).toBe(200);
  const afterLogout = await agent.get("/api/auth/get-session");
  expect(afterLogout.body).toBeNull();
  expect((await agent.get("/api/users/me")).status).toBe(401);

  const login = await agent.post("/api/auth/sign-in/email").send({ email, password });
  expect(login.status).toBe(200);
  expect((await agent.get("/api/auth/get-session")).body.user.email).toBe(email);
 });
});
