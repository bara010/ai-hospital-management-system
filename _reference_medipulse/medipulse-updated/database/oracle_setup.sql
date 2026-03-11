-- ================================================================
-- MediPulse Hospital Management System - Oracle Database Setup
-- Oracle 19c / 21c / 23c Compatible
-- ================================================================
-- HOW TO RUN:
--   1. Open SQL*Plus or SQLcl as SYSDBA:
--      sqlplus sys/yourpassword@localhost:1521/MEDIPULSE as sysdba
--   2. Run this file: @oracle_setup.sql
--   3. Then start the Spring Boot backend (it creates tables automatically)
--   4. After backend starts, run the seed INSERT statements at the bottom
-- ================================================================

-- ── Step 1: Create Tablespace ─────────────────────────────────────────────────
CREATE TABLESPACE medipulse_data
  DATAFILE 'medipulse_data01.dbf' SIZE 500M AUTOEXTEND ON NEXT 100M MAXSIZE UNLIMITED
  LOGGING
  EXTENT MANAGEMENT LOCAL SEGMENT SPACE MANAGEMENT AUTO;

-- ── Step 2: Create Schema User ────────────────────────────────────────────────
CREATE USER medipulse_user IDENTIFIED BY "MediPulse@2024"
  DEFAULT TABLESPACE medipulse_data
  TEMPORARY TABLESPACE temp
  QUOTA UNLIMITED ON medipulse_data;

-- ── Step 3: Grant Privileges ──────────────────────────────────────────────────
GRANT CREATE SESSION        TO medipulse_user;
GRANT CREATE TABLE          TO medipulse_user;
GRANT CREATE VIEW           TO medipulse_user;
GRANT CREATE SEQUENCE       TO medipulse_user;
GRANT CREATE PROCEDURE      TO medipulse_user;
GRANT CREATE TRIGGER        TO medipulse_user;
GRANT CREATE TYPE           TO medipulse_user;
GRANT CREATE SYNONYM        TO medipulse_user;
GRANT CREATE INDEX          TO medipulse_user;
GRANT SELECT ANY DICTIONARY TO medipulse_user;
GRANT CONNECT, RESOURCE     TO medipulse_user;
GRANT UNLIMITED TABLESPACE  TO medipulse_user;

-- ── Step 4: Connect as medipulse_user ────────────────────────────────────────
-- Run the rest of this script as medipulse_user:
-- CONNECT medipulse_user/MediPulse@2024@localhost:1521/MEDIPULSE

-- ── Step 5: Create ALL sequences (CRITICAL - must exist before Spring starts!) ─
-- Each JPA entity has its own sequence (Oracle best practice).

CREATE SEQUENCE users_seq              START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE notification_seq       START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE appointment_seq        START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE audit_log_seq          START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE bed_record_seq         START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE discharge_seq          START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE doctor_seq             START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE family_contact_seq     START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE invoice_seq            START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE medicine_schedule_seq  START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE mood_log_seq           START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE patient_seq            START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE pharmacy_item_seq      START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE telemedicine_seq       START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE user_settings_seq      START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE vital_record_seq       START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE health_history_seq     START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

COMMIT;

SELECT 'All sequences created successfully' AS status FROM dual;

-- ================================================================
-- !! STOP HERE !! Start Spring Boot backend now, wait for startup,
-- then continue with the seed data below.
-- ================================================================

-- ── Step 6: Seed demo users (run AFTER Spring Boot has created the tables) ──
-- Password for all demo accounts is: password123

MERGE INTO users u
USING (SELECT 'admin@hospital.com' AS email FROM dual) s
ON (u.email = s.email)
WHEN NOT MATCHED THEN
  INSERT (id, email, password, name, role, phone, created_at)
  VALUES (users_seq.NEXTVAL,
          'admin@hospital.com',
          '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
          'Admin User', 'ADMIN', '9999999991', SYSDATE);

MERGE INTO users u
USING (SELECT 'doctor@hospital.com' AS email FROM dual) s
ON (u.email = s.email)
WHEN NOT MATCHED THEN
  INSERT (id, email, password, name, role, phone, created_at)
  VALUES (users_seq.NEXTVAL,
          'doctor@hospital.com',
          '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
          'Dr. Smith', 'DOCTOR', '9999999992', SYSDATE);

MERGE INTO users u
USING (SELECT 'patient@hospital.com' AS email FROM dual) s
ON (u.email = s.email)
WHEN NOT MATCHED THEN
  INSERT (id, email, password, name, role, phone, created_at)
  VALUES (users_seq.NEXTVAL,
          'patient@hospital.com',
          '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
          'John Patient', 'PATIENT', '9999999993', SYSDATE);

COMMIT;

SELECT 'Demo users seeded. Login: admin@hospital.com / password123' AS status FROM dual;
