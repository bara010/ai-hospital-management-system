# 🔴 MediPulse – Oracle Database Setup Guide

## Oracle Connection Credentials

| Property       | Value                     |
|----------------|---------------------------|
| Host           | `localhost`               |
| Port           | `1521`                    |
| Service Name   | `MEDIPULSE`               |
| Username       | `medipulse_user`          |
| Password       | `MediPulse@2024`          |
| JDBC URL       | `jdbc:oracle:thin:@//localhost:1521/MEDIPULSE` |

## Step-by-Step Oracle Setup

### 1. Install Oracle Database (if not installed)
- **Oracle XE 21c (Free):** https://www.oracle.com/database/technologies/xe-downloads.html
- **Docker (recommended):**
  ```bash
  docker run -d --name oracle-medipulse \
    -p 1521:1521 \
    -e ORACLE_PASSWORD=Admin1234 \
    container-registry.oracle.com/database/express:21.3.0-xe
  ```

### 2. Create the Schema
Connect as SYSDBA and run:
```sql
-- In SQL*Plus or SQLcl as SYSDBA:
@database/oracle_setup.sql
```

Or manually:
```bash
sqlplus sys/Admin1234@//localhost:1521/XE as sysdba @database/oracle_setup.sql
```

### 3. Start the Backend
```bash
cd backend
mvn spring-boot:run
```
Spring Boot will auto-create all tables via `ddl-auto=update`.

### 4. Load Demo Data
After tables are created, connect as `medipulse_user` and run the MERGE statements at the bottom of `oracle_setup.sql`.

### 5. Start the Frontend
```bash
cd frontend
npm install
npm start
```

## Demo Accounts

| Role    | Email                    | Password      |
|---------|--------------------------|---------------|
| Admin   | admin@hospital.com       | password123   |
| Doctor  | doctor@hospital.com      | password123   |
| Patient | patient@hospital.com     | password123   |

## Common Errors & Fixes

| Error | Fix |
|-------|-----|
| `ORA-12541: No listener` | Start Oracle: `lsnrctl start` |
| `ORA-01017: invalid credentials` | Check username/password in `application.properties` |
| `ORA-00942: table or view does not exist` | Run application once to let Hibernate create tables |
| `ClassNotFoundException: oracle.jdbc.OracleDriver` | Add ojdbc11 jar to classpath or ensure Maven dependency is resolved |
| `Cannot load driver class` | Ensure ojdbc11 is in Maven Central or add local repo |

## Architecture

```
Frontend (React)  ──► Backend (Spring Boot)  ──► Oracle DB 21c
     :3000               :8080                      :1521
                           │
                       JWT Auth
                       JPA / Hibernate
                       Oracle Dialect
```
