# 🏥 MediPulse — Oracle Edition

> Hospital Intelligence Platform · Spring Boot · React · Oracle Database 23c

---

## 🔶 Oracle Database Configuration

### Credentials

| Property | Value |
|---|---|
| **Host** | `localhost` |
| **Port** | `1521` |
| **Service Name** | `XEPDB1` |
| **Schema/User** | `medipulse` |
| **Password** | `MediPulse@2024` |
| **JDBC URL** | `jdbc:oracle:thin:@//localhost:1521/XEPDB1` |

> **Production**: Update credentials in `backend/src/main/resources/application.properties`

---

## 🚀 Quick Start

### Prerequisites
- Java 21+
- Node.js 18+
- Oracle Database 21c/23c (or Oracle XE 21c free)
- Maven 3.8+
- Python 3.10+ (for AI service)

### 1. Install Oracle XE (Free)

Download Oracle XE 21c from:  
https://www.oracle.com/database/technologies/xe-downloads.html

Or use Docker:
```bash
docker run -d -p 1521:1521 -p 5500:5500 \
  -e ORACLE_PASSWORD=SysPassword123 \
  --name oracle-xe \
  gvenzl/oracle-xe:21-slim
```

### 2. Create Schema

Connect as SYSDBA and run the setup script:
```bash
# If using Docker:
docker exec -it oracle-xe sqlplus sys/SysPassword123@//localhost:1521/XEPDB1 as sysdba

# Then in SQL*Plus, paste the contents of:
database/oracle_setup.sql
```

Or via SQL*Plus directly:
```bash
sqlplus sys/YourSysPassword@//localhost:1521/XEPDB1 as sysdba @database/oracle_setup.sql
```

### 3. Start Backend

```bash
cd backend
mvn clean spring-boot:run
```

Spring Boot will:
- Connect to Oracle via JDBC
- Auto-create all tables (Hibernate `ddl-auto=update`)
- Start on http://localhost:8080

### 4. Seed Demo Data

After Spring Boot starts (tables created), run seed data:
```bash
sqlplus medipulse/MediPulse@2024@//localhost:1521/XEPDB1 @database/oracle_setup.sql
```

### 5. Start Frontend

```bash
cd frontend
npm install
npm start
```

Frontend starts at: http://localhost:3000

### 6. Start AI Service (optional)

```bash
cd ai-service
pip install -r requirements.txt
python app.py
```

---

## 🔐 Demo Accounts

| Role | Email | Password |
|---|---|---|
| 🛡️ Admin | admin@hospital.com | password123 |
| 👨‍⚕️ Doctor | doctor@hospital.com | password123 |
| 🏥 Patient | patient@hospital.com | password123 |

---

## 🗃️ Database Notes (PostgreSQL → Oracle Changes)

### Key Syntax Differences Fixed

| PostgreSQL | Oracle |
|---|---|
| `NOW()` | `SYSDATE` |
| `CURRENT_DATE + INTERVAL '3 days'` | `SYSDATE + 3` |
| `true` / `false` | `1` / `0` |
| `ON CONFLICT DO NOTHING` | `... WHERE NOT EXISTS (SELECT 1 FROM ...)` |
| `CREATE DATABASE` | `CREATE USER` (Oracle uses schemas) |
| `H2Dialect` | `OracleDialect` |
| `postgresql` driver | `ojdbc11` driver |

### Maven Dependency Changed

```xml
<!-- BEFORE (PostgreSQL) -->
<dependency>
  <groupId>org.postgresql</groupId>
  <artifactId>postgresql</artifactId>
</dependency>

<!-- AFTER (Oracle) -->
<dependency>
  <groupId>com.oracle.database.jdbc</groupId>
  <artifactId>ojdbc11</artifactId>
  <version>23.3.0.23.09</version>
</dependency>
```

---

## 📁 Project Structure

```
medipulse-oracle/
├── backend/
│   ├── pom.xml                          ← Oracle JDBC dependency
│   └── src/main/resources/
│       └── application.properties       ← Oracle connection config
├── database/
│   └── oracle_setup.sql                 ← Oracle-compatible seed data
├── frontend/
│   └── src/pages/Login.jsx              ← Advanced login UI
└── ai-service/
    └── app.py
```

---

## 🌟 Features

- 🤖 **AI Risk Analysis** — Readmission & no-show prediction
- 💊 **Smart Medication Reminders** — Scheduled alerts
- 🧪 **Lab Alerts** — Critical value notifications
- 📊 **Live Analytics** — Charts & health trends
- 🏥 **Bed Occupancy** — Ward & ICU tracking
- 💳 **Billing** — Invoices & payment status
- 👨‍👩‍👧 **Family Portal** — Family member alerts
- 📹 **Telemedicine** — Video consultation rooms
- 😊 **Mood Tracker** — Patient mental health logging
- 🚨 **Emergency SOS** — Critical alert system

---

## 🔧 Troubleshooting

**ORA-01017: invalid username/password**  
→ Ensure the `medipulse` user is created (run Step 2 first)

**ORA-12541: No listener**  
→ Oracle listener not running. Start with: `lsnrctl start`

**TNS:could not resolve the connect identifier**  
→ Check the JDBC URL format: `jdbc:oracle:thin:@//host:port/service`

**ClassNotFoundException: oracle.jdbc.OracleDriver**  
→ Ensure `ojdbc11` is in Maven dependencies and downloaded

---

*MediPulse · Powered by Oracle Database 23c · Built with Spring Boot & React*
