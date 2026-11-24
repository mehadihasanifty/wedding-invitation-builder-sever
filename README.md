# Wedding Invitation Builder API
Express 5 and TypeScript API. Requires Node.js 20+, npm, and MongoDB. Copy `.env.example` for a fresh setup; the existing `.env` is preserved. `MONGODB_URI` is required; `PORT` defaults to 5000 and `CLIENT_ORIGIN` to http://localhost:3000.

- `npm run dev` — reloadable development server
- `npm run build` — compile to `dist/`
- `npm start` — run compiled server
- `npm run typecheck` — TypeScript check
- `npm test` — Better Auth and protected API integration tests

The process connects to MongoDB before listening. Health endpoint: `GET /api/health`.
# Authentication configuration

Better Auth is served by Express at `BETTER_AUTH_URL` (default `http://localhost:5000`). Set `BETTER_AUTH_SECRET` to a private random value of at least 32 characters. `CLIENT_ORIGIN` must match the frontend origin and the browser client sends credentials.

Password recovery is enabled only when both `RESEND_API_KEY` and `EMAIL_FROM` are configured. Keep all server environment values private.
