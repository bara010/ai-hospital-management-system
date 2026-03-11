# HOSPITO Online Deployment (Production)

This guide deploys:
- Frontend (React/Vite) on **Vercel**
- Backend (Spring Boot) on **Render**
- Database on **Supabase (PostgreSQL)**

---

## 1) Prepare Supabase (PostgreSQL)

1. Create a Supabase project (or managed Postgres).
2. Run schema script:
   - `backend/src/main/resources/schema-supabase.sql`
3. Keep these values ready:
   - `DB_URL` (example: `jdbc:postgresql://db.<project-ref>.supabase.co:5432/postgres?sslmode=require`)
   - `DB_USER` (usually `postgres`)
   - `DB_PASSWORD`

---

## 2) Deploy Backend on Render

1. Push this project to GitHub.
2. In Render, create a **Web Service**:
   - Root Directory: `backend`
   - Build Command: `mvn -q -DskipTests package`
   - Start Command: `java -Dserver.port=$PORT -jar target/hospito-backend-1.0.0.jar`
3. Add environment variables in Render:

```env
DB_URL=jdbc:postgresql://db.<project-ref>.supabase.co:5432/postgres?sslmode=require
DB_USER=postgres
DB_PASSWORD=<supabase-db-password>
DDL_AUTO=update
JWT_SECRET=<very-long-random-secret-64+chars>
JWT_EXP_MINUTES=120
JWT_LOGIN_EXP_MINUTES=5
UPLOAD_DIR=/opt/render/project/uploads
EMAIL_ENABLED=true
EMAIL_FROM=<your-from-email>
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=<smtp-username>
MAIL_PASSWORD=<smtp-app-password>
MAIL_SMTP_AUTH=true
MAIL_SMTP_STARTTLS=true
FIREBASE_SERVICE_ACCOUNT=<absolute-path-or-mounted-json>
MEDICATION_REMINDER_INTERVAL_MS=300000
MEDICATION_REMINDER_COOLDOWN_MINUTES=45
```

4. Health check URL:
   - `https://<your-backend-domain>/api/public/health`

---

## 3) Deploy Frontend on Vercel

1. In Vercel, import the same GitHub repo.
2. Set project root to `frontend`.
3. Framework preset: `Vite`.
4. Add env vars:

```env
VITE_API_BASE_URL=https://<your-backend-domain>/api
VITE_FIREBASE_API_KEY=<firebase-web-api-key>
VITE_FIREBASE_AUTH_DOMAIN=<firebase-auth-domain>
VITE_FIREBASE_PROJECT_ID=<firebase-project-id>
VITE_FIREBASE_STORAGE_BUCKET=<firebase-storage-bucket>
VITE_FIREBASE_MESSAGING_SENDER_ID=<firebase-sender-id>
VITE_FIREBASE_APP_ID=<firebase-app-id>
VITE_FIREBASE_VAPID_KEY=<firebase-vapid-key>
# Optional TURN/STUN list for stronger WebRTC connectivity
# VITE_WEBRTC_ICE_SERVERS=[{"urls":"stun:stun.l.google.com:19302"},{"urls":"turn:your-turn-server:3478","username":"user","credential":"pass"}]
```

5. Deploy.

---

## 4) Domain + Security

1. Point custom domains:
   - `api.yourdomain.com` -> Render backend
   - `app.yourdomain.com` -> Vercel frontend
2. Ensure HTTPS is active on both.
3. Add your frontend domain to Firebase Authorized Domains.

---

## 5) Post-Deploy Checklist

- Open `https://api.yourdomain.com/api/public/health` -> should return `status: UP`.
- Register + TOTP login works from hosted frontend.
- Appointment booking works.
- Doctor medication prescribing works.
- Notifications page opens and marks read.
- Video call works over HTTPS (use TURN server for strict networks).

---

## Notes

- Current upload storage is local filesystem (`UPLOAD_DIR`). On cloud restart/redeploy, files may be lost unless using persistent disk/object storage.
- For production scale (multiple backend instances), move WebSocket signaling broker to Redis/RabbitMQ instead of in-memory simple broker.


