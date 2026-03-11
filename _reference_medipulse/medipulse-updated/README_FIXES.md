# MediPulse — What Was Fixed

## Bugs Fixed

### 1. Oracle Sequence Error (ORA-02289) — CRITICAL
**Problem:** All JPA entities used a single shared `hibernate_sequence`. Oracle requires this to exist before the app starts, but it was never created.
**Fix:** Every entity now uses its own dedicated sequence (e.g. `users_seq`, `notification_seq`, etc.). All sequences are created in `oracle_setup.sql`.

### 2. Register Not Saving to DB — CRITICAL
**Problem:** `AuthController.registerVerifyOtp()` had a DNS lookup in email validation that caused `UnknownHostException` and threw a 500 error before `userRepo.save()` was ever called.
**Fix:** Removed DNS lookup from email validation. Registration now reliably saves to Oracle.

### 3. Email Crash Blocking OTP Flow — CRITICAL
**Problem:** `hospital.email.enabled=true` but credentials were placeholder text. This caused `JavaMailException` that crashed the OTP send endpoint entirely.
**Fix:** Set `hospital.email.enabled=false` by default. OTPs now always print to the backend console. Set to `true` only after filling real Gmail credentials.

### 4. OTP Email Crash Blocking Response
**Problem:** Email sending was synchronous — a failed SMTP send caused the entire `/send-otp` request to return 500.
**Fix:** Email is now sent `@Async` in a background thread. OTP is stored and printed to console first, so the HTTP response always succeeds.

### 5. CORS Too Restrictive
**Problem:** `@CrossOrigin(origins = "http://localhost:3000")` blocked requests if frontend ran on a different port.
**Fix:** Changed to `@CrossOrigin(origins = "*")` for development flexibility.

### 6. DataInitializer Crash on Oracle Startup
**Problem:** If Oracle sequences didn't exist yet, `userRepo.count()` threw an exception and crashed the app on startup.
**Fix:** Wrapped entire DataInitializer in try-catch with a helpful error message. Each seed section is individually wrapped so partial failures don't break the whole seed.

### 7. @EnableAsync Missing
**Problem:** `@Async` on `OtpService.sendOtpEmailAsync()` was silently ignored without `@EnableAsync` on the main application class.
**Fix:** Added `@EnableAsync` to `HospitalManagementApplication.java`.

---

## How to Start

### Step 1: Set Up Oracle DB
```sql
-- Run as SYSDBA:
@database/oracle_setup.sql
```

### Step 2: Start Backend
```bash
cd backend
mvn spring-boot:run
```
Wait for startup. OTPs will appear in this terminal.

### Step 3: Start Frontend
```bash
cd frontend
npm install
npm start
```

### Step 4: Login
- `admin@hospital.com` / `password123`
- `doctor@hospital.com` / `password123`
- `patient@hospital.com` / `password123`

Or register a new account — OTP will print in the backend console.

### Step 5: Enable Real Email (Optional)
In `backend/src/main/resources/application.properties`:
```properties
spring.mail.username=your@gmail.com
spring.mail.password=your16charapppassword  # Google App Password, no spaces
hospital.email.from=your@gmail.com
hospital.email.enabled=true
```
