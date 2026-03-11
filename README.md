# HOSPITO - Complete Hospital Management System

HOSPITO is a full-stack hospital platform with secure TOTP + JWT authentication, role-based dashboards, appointment lifecycle management, medical records, prescriptions, doctor ratings, WebRTC consultation, and FCM-powered notifications.

## Tech Stack

- Backend: Java 17, Spring Boot 3, Spring Security, Spring Data JPA, WebSocket (STOMP)
- Database: Supabase (PostgreSQL)
- Frontend: React + Vite
- Push Notifications: Firebase Cloud Messaging (FCM)
- Video Consultation: WebRTC with Spring WebSocket signaling

## Monorepo Structure

```text
HOSPITO/
  backend/
    pom.xml
    src/main/java/com/hospito/
      config/
      controller/
      dto/
      entity/
      exception/
      repository/
      security/
      service/
      websocket/
    src/main/resources/
      application.yml
      schema-supabase.sql
  frontend/
    package.json
    vite.config.js
    src/
      components/
      context/
      hooks/
      pages/
      services/
      styles/
```

## Backend Architecture

- `controller`: REST endpoints for auth, roles, profile, files, notifications, appointments
- `service`: Business logic (registration, booking rules, reminders, ratings, notifications)
- `repository`: JPA data access
- `entity`: JPA-mapped domain model
- `security`: JWT filter, token service, auth context
- `config`: Security, WebSocket, Firebase, data initializer, static upload mapping

## Frontend Architecture

- `pages`: Home, login, register, dashboards, doctors list, booking, video, profile
- `components`: Layout, cards, route guards, tables, loaders
- `services`: Axios API clients + FCM helper
- `context/hooks`: Auth state, login flow, role handling
- `styles`: Professional medical UI theme (white, blue, soft green)

## Database Schema

Supabase (PostgreSQL) DDL is included at:
- `backend/src/main/resources/schema-supabase.sql`

Core tables:
- `users`
- `patient_profiles`
- `doctor_profiles`
- `doctor_availability`
- `appointments`
- `medical_records`
- `prescriptions`
- `notifications`
- `doctor_ratings`

## API Endpoints

Base URL: `http://localhost:8080/api`

### Authentication

- `POST /auth/register`
- `POST /auth/register/verify-totp`
- `POST /auth/login/start`
- `POST /auth/login/verify-totp`
- `POST /auth/login`
- `POST /auth/fcm-token`

### Public

- `GET /public/doctors?specialization=...`
- `GET /public/doctors/{doctorId}/ratings`

### Patient

- `POST /patients/me/appointments`
- `GET /patients/me/appointments`
- `PATCH /patients/me/appointments/{appointmentId}/cancel`
- `GET /patients/me/medical-records`
- `GET /patients/me/prescriptions`
- `POST /patients/me/ratings`

### Doctor

- `GET /doctors/me/appointments`
- `PUT /doctors/me/appointments/{appointmentId}/status`
- `GET /doctors/me/availability`
- `PUT /doctors/me/availability`
- `POST /doctors/me/medical-records`
- `GET /doctors/me/medical-records`
- `POST /doctors/me/prescriptions`
- `GET /doctors/me/prescriptions`

### Admin

- `GET /admin/dashboard`
- `GET /admin/doctors`
- `PATCH /admin/doctors/{doctorId}/approval`
- `GET /admin/patients`
- `GET /admin/appointments`

### Shared Authenticated

- `GET /appointments/{appointmentId}`
- `GET /notifications/me`
- `GET /notifications/me/unread-count`
- `PATCH /notifications/me/{notificationId}/read`
- `GET /profile/me`
- `PUT /profile/me`
- `POST /profile/me/photo`
- `POST /files/reports`

### WebSocket Signaling (Video)

- STOMP endpoint: `/ws-signaling`
- Publish: `/app/signal/{roomId}`
- Subscribe: `/topic/signal/{roomId}`

## One-Click Start (Windows)

From the project root, double-click:

- `start-hospito.bat`

This script will:
- verify Java, Maven, and Node/NPM are available
- install frontend dependencies if missing
- start backend and frontend in separate terminal windows
- automatically open the frontend in your browser

Default launcher mode uses `DDL_AUTO=create` to rebuild schema and avoid old-table migration issues.

If you want persistent data, run with update mode:

```bat
set DDL_AUTO=update
start-hospito.bat
```

## Instant Online Demo (No Supabase)

If you cannot provision Supabase now, use local Postgres + a public tunnel.

Run from project root:

```bat
start-hospito-online.bat
```

This will:
- load backend env from `backend/.env.local`
- load frontend env from `frontend/.env.local`
- start backend + frontend
- create a public `localtunnel` URL for external access

Notes:
- This is a temporary demo setup, not permanent production hosting.
- Keep all opened terminals running to keep the public URL active.
- URL may change when tunnel restarts.

## Setup Instructions

## 1) Supabase (PostgreSQL)

1. Create a Supabase project (or local Postgres).
2. Copy the database connection string and password.
3. Run:
   - `backend/src/main/resources/schema-supabase.sql`

## 2) Backend

```bash
cd backend
mvn -q -DskipTests compile
mvn spring-boot:run
```

Environment variables:

- `DB_URL` (default: `jdbc:postgresql://localhost:5432/hospito`)
- `DB_USER` (default: `postgres`)
- `DB_PASSWORD` (default: `postgres`)
- `JWT_SECRET` (set a long secure key in production)
- `JWT_EXP_MINUTES` (default: `120`)
- `JWT_LOGIN_EXP_MINUTES` (default: `5`)
- `UPLOAD_DIR` (default: `uploads`)
- `FIREBASE_SERVICE_ACCOUNT` (path to Firebase Admin service account JSON)
- `hospito.admin.*` values (optional admin seed overrides)

## 3) Frontend

```bash
cd frontend
npm install
npm run dev
```

Optional frontend env (`frontend/.env`):

- `VITE_API_BASE_URL=http://localhost:8080/api`
- Firebase web config keys for FCM token registration:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
  - `VITE_FIREBASE_VAPID_KEY`

## 4) Login and TOTP Flow

1. Register user with role (Patient/Doctor/Admin)
2. Scan returned QR code using Google Authenticator / Microsoft Authenticator / Authy
3. Verify TOTP via register verification API or UI
4. Login with email + password + current 6-digit TOTP code

## Online Hosting (Cloud)

Use this ready guide for production deployment:

- `DEPLOYMENT.md`

It includes:
- Supabase DB setup
- Render backend deployment
- Vercel frontend deployment
- Required production environment variables
- Domain/HTTPS checklist

Health endpoint for uptime checks:
- `GET /api/public/health`

## Production Notes

- Replace default JWT secret and admin credentials.
- Configure TLS/HTTPS before production rollout.
- Configure TURN server for robust WebRTC beyond local/NAT-friendly networks.
- Configure Firebase service account + web credentials for full push delivery.
- Add integration tests and CI pipeline for production deployment.





























