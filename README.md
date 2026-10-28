# Doctor Tracker Backend

Standalone Node.js + Express REST API for Doctor Tracker. The API owns authentication, validation, database queries, and analytics; the Next.js app is a separate client.

## Requirements

- Node.js 20 or newer
- npm
- MongoDB local instance or MongoDB Atlas database

## Run locally

```bash
cp .env.example .env
# Edit .env with your MongoDB URI, a random JWT secret (32+ characters), and admin credentials.
npm install
npm run seed:admin
npm run seed:demo   # optional fictional sample records
npm run dev
```

Health check: `http://localhost:5000/api/health`.

## Environment variables

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Long, random signing secret; never commit it |
| `JWT_EXPIRES_IN` | JWT lifetime (default `1d`) |
| `FRONTEND_ORIGIN` | Exact frontend origin; comma-separated origins are supported |
| `COOKIE_SAME_SITE` | `lax` locally; typically `none` for separate HTTPS hosting domains |
| `ADMIN_EMAIL` | Admin account email for the seed script |
| `ADMIN_PASSWORD` | Unique admin password of at least 12 characters |

## API overview

All endpoints except health and login require the HTTP-only session cookie.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Current admin |
| POST | `/api/auth/logout` | End session |
| GET / POST | `/api/doctors` | Search/filter/paginate or create doctors |
| GET | `/api/doctors/:id` | Doctor detail |
| GET / POST | `/api/doctors/:id/patients` | List or add patients for a doctor |
| GET | `/api/patients` | Search/filter/paginate all patients |
| PATCH / DELETE | `/api/patients/:id` | Update or delete patient |
| GET | `/api/analytics/summary` | Dashboard metrics and chart series |

List endpoints accept `page`, `limit` (maximum 50), `search`, and date range `from` / `to` in `YYYY-MM-DD` format. Doctor listing also accepts `specialization` and `hospital`; patient listing accepts `condition` and `doctorId`.

## Architecture and decisions

1. **Separate Express API:** business logic and database access remain outside Next.js, as required by the assessment; frontend and backend can deploy independently.
2. **Referenced patient documents:** each patient stores a `doctor` ObjectId reference. This supports independent patient CRUD, global filtering, pagination, and patients-per-doctor aggregation.
3. **HTTP-only cookie:** JavaScript cannot read the JWT. Use HTTPS in production and verify cookie/CORS behavior in the deployed browser.
4. **Server-side pagination and aggregation:** MongoDB returns only requested list pages and calculates dashboard metrics close to the data.

## Deployment (Render)

- Build command: `npm install`
- Start command: `npm start`
- Add `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_ORIGIN`, `COOKIE_SAME_SITE`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in Render environment settings.
- Set `FRONTEND_ORIGIN` to the exact deployed frontend origin. For separate HTTPS origins, `COOKIE_SAME_SITE=none` and a secure cookie are usually needed.
- Run `npm run seed:admin` once against the same Atlas database used by the deployed API. Keep the seed password out of source control and remove it from runtime settings when possible.

## Testing

Run `npm test` for utility unit tests. Before submission, also manually test login/logout, unauthenticated API responses, doctor and patient workflows, filters, pagination, dashboard refresh, and the live cookie flow.

## Safety note

This is an assessment/demo project. Use fictional records only. It is not a production clinical-record system and must not store real patient data.
