# MediPulse - Complete Setup Guide
## How to Run: Frontend + Backend + Oracle DB

---

## 🔴 STEP 1: Oracle Database Setup

### Option A: Oracle XE (Free - Recommended for local dev)
Download Oracle Database Express Edition 21c from:
https://www.oracle.com/database/technologies/xe-downloads.html

After installing, open SQL*Plus as SYSDBA:
```
sqlplus / as sysdba
```

Then run the setup script:
```sql
@database/oracle_setup.sql
```

**Key Oracle connection details:**
- Host: `localhost`
- Port: `1521`
- Service name: `MEDIPULSE` (or `XE` for Oracle XE — see note below)
- Username: `medipulse_user`
- Password: `MediPulse@2024`

> ⚠️ **If using Oracle XE**, change the datasource URL in `backend/src/main/resources/application.properties`:
> ```
> spring.datasource.url=jdbc:oracle:thin:@//localhost:1521/XE
> ```

### Option B: Oracle Cloud (Free Tier)
Create a free Oracle Autonomous Database at cloud.oracle.com and update the JDBC URL in application.properties.

---

## 🟢 STEP 2: Start the Backend (Spring Boot)

### Requirements:
- Java 17+
- Maven 3.8+

### Run:
```bash
cd backend
mvn spring-boot:run
```

The backend starts on **http://localhost:8080**

✅ You'll see: `Started HospitalManagementApplication in X.XXX seconds`

> ⚠️ The first time you start, Spring Boot will auto-create all database tables.
> After the first start, run the seed data in Step 2b.

### Step 2b: Load Seed Data (first time only)
After Spring Boot starts successfully, connect as `medipulse_user` in SQL*Plus and run the MERGE statements from `database/oracle_setup.sql` (the section labelled Step 7).

Demo accounts (password: `password123`):
- `admin@hospital.com`
- `doctor@hospital.com`
- `patient@hospital.com`

---

## 🔵 STEP 3: Start the Frontend (React)

### Requirements:
- Node.js 18+
- npm

### Run:
```bash
cd frontend
npm install
npm start
```

The frontend starts on **http://localhost:3000**

---

## ✅ STEP 4: Test Registration & Login

1. Open http://localhost:3000/register
2. Fill in your details and click **Create MediPulse Account**
3. You'll be logged in and redirected to the dashboard
4. Your user is now stored in Oracle under the `USERS` table

To verify in Oracle:
```sql
SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC;
```

---

## 🐛 Troubleshooting

### "Registration failed. Please try again."
- **Backend not running** → Make sure `mvn spring-boot:run` is running on port 8080
- **Oracle not connected** → Confirm Oracle is running: `lsnrctl status`
- **hibernate_sequence missing** → Run `CREATE SEQUENCE hibernate_sequence START WITH 1 INCREMENT BY 1 NOCACHE;` as `medipulse_user`
- **Email already taken** → The email is already in the USERS table

### "Cannot connect to Oracle"
- Make sure Oracle Listener is running: `lsnrctl start`
- Check service name matches (XE vs MEDIPULSE)

### CORS error in browser console
- Backend must be on port 8080
- Frontend must be on port 3000
- Both must be running simultaneously

---

## 📁 Project Structure
```
medipulse-oracle/
├── backend/          ← Spring Boot (Java 17, Maven)
│   └── src/main/resources/application.properties  ← DB config here
├── frontend/         ← React (Node 18+)
│   └── src/services/api.js  ← Points to localhost:8080
├── database/
│   └── oracle_setup.sql  ← Run this first!
└── SETUP_GUIDE.md    ← This file
```
