-- ================================================================
-- Hospital Management System - PostgreSQL Database Setup
-- Run this ONCE before starting the application
-- ================================================================

-- Create database (run this separately in psql if needed)
-- CREATE DATABASE hospital_db;

-- Connect to hospital_db before running the rest
-- \c hospital_db

-- Spring Boot will auto-create all tables via JPA.
-- Run this file AFTER starting Spring Boot for the first time
-- so that tables already exist.

-- ── Demo Users (password = "password123" bcrypt encoded) ─────────────────────
INSERT INTO users (email, password, name, role, phone, created_at)
VALUES
  ('admin@hospital.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Admin User',   'ADMIN',   '9999999991', NOW()),
  ('doctor@hospital.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Dr. Smith',    'DOCTOR',  '9999999992', NOW()),
  ('patient@hospital.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'John Patient', 'PATIENT', '9999999993', NOW())
ON CONFLICT (email) DO NOTHING;

-- ── Demo Medicine Schedules ───────────────────────────────────────────────────
INSERT INTO medicine_schedules (patient_id, patient_name, medicine_name, dose, reminder_hour, reminder_minute, time_of_day, active)
VALUES
  (3, 'John Patient', 'Metformin',  '500mg', 8,  0,  'morning',   true),
  (3, 'John Patient', 'Metformin',  '500mg', 14, 0,  'afternoon', true),
  (3, 'John Patient', 'Amlodipine', '5mg',   9,  30, 'morning',   true)
ON CONFLICT DO NOTHING;

-- ── Demo Notifications ────────────────────────────────────────────────────────
INSERT INTO notifications (type, title, message, recipient_type, patient_id, is_read, created_at)
VALUES
  ('MEDICINE_REMINDER',    '💊 Medicine Reminder',      '🌅 Good morning John! Time to take your Metformin 500mg. Stay healthy! 💊',     'PATIENT', 3, false, NOW()),
  ('MOOD_CHECK',           '😊 How Are You Feeling?',   'Hey John! How are you feeling today? Tap to tell your doctor 💙',               'PATIENT', 3, false, NOW()),
  ('APPOINTMENT_REMINDER', '📅 Appointment Tomorrow!',  'Hi John! You have an appointment with Dr. Smith tomorrow at 10:00 AM 🏥',       'PATIENT', 3, false, NOW()),
  ('HEALTH_TIP',           '🏥 Health Tip',             '💡 Dr. Smith: Drink 8 glasses of water and walk 30 minutes today! 💧',         'PATIENT', 3, false, NOW()),
  ('LAB_ALERT',            '🧪 Critical Lab Alert',     '🚨 2 abnormal lab results for patient John. Immediate review required!',        'DOCTOR',  3, false, NOW()),
  ('READMISSION',          '🏥 Readmission Risk Alert', 'Patient John has HIGH readmission risk (78%). Please schedule a follow-up.',    'DOCTOR',  3, false, NOW()),
  ('STOCK',                '💊 Stock Alert',            '⚠️ Amoxicillin will run out in 2 days! Order immediately.',                     'DOCTOR',  NULL, false, NOW())
ON CONFLICT DO NOTHING;

SELECT 'Hospital DB demo data inserted ✅' AS status;

-- ── Demo Appointments ─────────────────────────────────────────────────────────
-- (Run after Spring Boot has started and created the appointments table)
INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, status, reason, created_at)
VALUES
  (1, 1, CURRENT_DATE + INTERVAL '3 days', '10:00', 'SCHEDULED', 'Regular follow-up check-up', NOW()),
  (1, 1, CURRENT_DATE + INTERVAL '7 days', '14:30', 'SCHEDULED', 'Blood pressure monitoring', NOW()),
  (1, 1, CURRENT_DATE - INTERVAL '10 days', '09:00', 'COMPLETED', 'Diabetes consultation', NOW())
ON CONFLICT DO NOTHING;

SELECT 'MediPulse v2 demo data inserted ✅' AS status;

-- ═══════════════════════════════════════════════════════════════════════════════
-- EXTENDED DEMO DATA — Run AFTER Spring Boot has created all new tables
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Demo Vital Records ────────────────────────────────────────────────────────
INSERT INTO vital_records (patient_id, systolic, diastolic, blood_sugar, spo2, heart_rate, temperature, weight, notes, recorded_at)
VALUES
  (3, 128, 84, 110.5, 98, 74, 37.0, 72.5, 'Morning reading', NOW() - INTERVAL '6 days'),
  (3, 132, 86, 118.0, 97, 78, 36.8, 72.3, 'Post-lunch', NOW() - INTERVAL '5 days'),
  (3, 125, 82, 105.0, 98, 72, 36.9, 72.5, 'Evening reading', NOW() - INTERVAL '4 days'),
  (3, 130, 85, 122.0, 97, 76, 37.1, 72.4, 'Morning reading', NOW() - INTERVAL '3 days'),
  (3, 127, 83, 108.0, 98, 73, 36.7, 72.2, 'Post exercise', NOW() - INTERVAL '2 days'),
  (3, 124, 81, 103.0, 99, 71, 36.8, 72.0, 'Morning reading', NOW() - INTERVAL '1 day'),
  (3, 126, 82, 106.5, 98, 72, 36.9, 72.1, 'Today reading', NOW())
ON CONFLICT DO NOTHING;

-- ── Demo Mood Logs ────────────────────────────────────────────────────────────
INSERT INTO mood_logs (patient_id, patient_name, mood_score, mood_label, note, doctor_alerted, logged_at)
VALUES
  (3, 'John Patient', 7, '😄 Happy', 'Feeling much better after medication adjustment', false, NOW() - INTERVAL '6 days'),
  (3, 'John Patient', 5, '🙂 Neutral', 'Okay day, a little tired', false, NOW() - INTERVAL '5 days'),
  (3, 'John Patient', 3, '😞 Below Average', 'Side effects bothering me today', true, NOW() - INTERVAL '4 days'),
  (3, 'John Patient', 6, '😊 Good', 'Better after rest', false, NOW() - INTERVAL '3 days'),
  (3, 'John Patient', 8, '😁 Very Happy', 'Great day! Went for a walk', false, NOW() - INTERVAL '2 days'),
  (3, 'John Patient', 7, '😄 Happy', 'Good sleep, feeling refreshed', false, NOW() - INTERVAL '1 day'),
  (3, 'John Patient', 8, '😁 Very Happy', 'Morning jog helped mood', false, NOW())
ON CONFLICT DO NOTHING;

-- ── Demo Invoices ─────────────────────────────────────────────────────────────
INSERT INTO invoices (invoice_number, patient_name, patient_id_code, doctor_name, items_json, subtotal, tax, total, status, invoice_date, created_at)
VALUES
  ('INV-2024-001', 'Rahul Verma',    'PT-1001', 'Dr. Sharma', '[{"name":"General Consultation","category":"Consultation","qty":1,"price":500},{"name":"CBC","category":"Lab","qty":1,"price":250},{"name":"ECG","category":"Diagnostics","qty":1,"price":300},{"name":"IV Drip","category":"Procedure","qty":2,"price":350}]', 1750, 88, 1838, 'PAID',    NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('INV-2024-002', 'Sunita Patel',   'PT-1002', 'Dr. Mehta',  '[{"name":"Specialist Consultation","category":"Consultation","qty":1,"price":800}]', 800, 40, 840, 'PENDING', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
  ('INV-2024-003', 'Mohammed Shaikh','PT-1003', 'Dr. Nair',   '[{"name":"General Consultation","category":"Consultation","qty":1,"price":500},{"name":"X-Ray Chest","category":"Imaging","qty":1,"price":600},{"name":"Ultrasound","category":"Imaging","qty":1,"price":1200},{"name":"HbA1c","category":"Lab","qty":1,"price":400}]', 2700, 135, 2835, 'PAID',    NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
  ('INV-2024-004', 'Kavya Reddy',    'PT-1004', 'Dr. Sharma', '[{"name":"Specialist Consultation","category":"Consultation","qty":1,"price":800},{"name":"CBC","category":"Lab","qty":1,"price":250}]', 1050, 53, 1103, 'OVERDUE', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days')
ON CONFLICT DO NOTHING;

-- ── Demo Pharmacy Items ───────────────────────────────────────────────────────
INSERT INTO pharmacy_items (name, category, supplier, stock, min_stock, unit_price, unit, expiry_date, stock_status, last_restocked, created_at)
VALUES
  ('Amoxicillin 500mg',     'Antibiotic',     'MedSupply Co',    45,  50,  12.50,  'tablets', '2027-06-30', 'LOW',      NOW() - INTERVAL '10 days', NOW()),
  ('Metformin 500mg',       'Antidiabetic',   'PharmaCorp',      280, 100, 8.00,   'tablets', '2026-12-31', 'OK',       NOW() - INTERVAL '5 days',  NOW()),
  ('Amlodipine 5mg',        'Cardiovascular', 'HealthDist',      160, 80,  15.00,  'tablets', '2027-03-31', 'OK',       NOW() - INTERVAL '3 days',  NOW()),
  ('Paracetamol 500mg',     'Painkiller',     'MedSupply Co',    520, 200, 3.50,   'tablets', '2026-08-31', 'OK',       NOW() - INTERVAL '2 days',  NOW()),
  ('Insulin (Rapid Acting)','Antidiabetic',   'BioPharm',        0,   30,  185.00, 'vials',   '2026-06-30', 'CRITICAL', NOW() - INTERVAL '20 days', NOW()),
  ('Ciprofloxacin 250mg',   'Antibiotic',     'PharmaCorp',      85,  60,  18.00,  'tablets', '2027-09-30', 'OK',       NOW() - INTERVAL '7 days',  NOW()),
  ('Pantoprazole 40mg',     'Antacid',        'HealthDist',      190, 80,  9.50,   'tablets', '2027-01-31', 'OK',       NOW() - INTERVAL '4 days',  NOW()),
  ('Azithromycin 500mg',    'Antibiotic',     'MedSupply Co',    28,  40,  32.00,  'tablets', '2026-11-30', 'LOW',      NOW() - INTERVAL '15 days', NOW()),
  ('Atorvastatin 10mg',     'Cardiovascular', 'BioPharm',        145, 60,  22.00,  'tablets', '2027-05-31', 'OK',       NOW() - INTERVAL '6 days',  NOW()),
  ('IV Saline 500ml',       'IV Fluid',       'FluidMed',        75,  100, 45.00,  'bags',    '2026-09-30', 'LOW',      NOW() - INTERVAL '8 days',  NOW())
ON CONFLICT DO NOTHING;

-- ── Demo Bed Records ──────────────────────────────────────────────────────────
INSERT INTO bed_records (ward, bed_number, status, patient_name, patient_id, admitted_for, admitted_at, updated_at)
VALUES
  ('ICU', 'ICU-01', 'OCCUPIED',    'Rahul Verma',     NULL, 'Post-cardiac surgery monitoring',  NOW() - INTERVAL '2 days', NOW()),
  ('ICU', 'ICU-02', 'OCCUPIED',    'Priya Singh',     NULL, 'Severe pneumonia',                 NOW() - INTERVAL '1 day',  NOW()),
  ('ICU', 'ICU-03', 'VACANT',       NULL,             NULL, NULL, NULL, NOW()),
  ('ICU', 'ICU-04', 'MAINTENANCE',  NULL,             NULL, NULL, NULL, NOW()),
  ('General', 'GEN-01', 'OCCUPIED', 'Mohammed Shaikh', NULL, 'Diabetes management',             NOW() - INTERVAL '3 days', NOW()),
  ('General', 'GEN-02', 'OCCUPIED', 'Sunita Patel',   NULL, 'Recovery post appendectomy',       NOW() - INTERVAL '1 day',  NOW()),
  ('General', 'GEN-03', 'VACANT',    NULL,            NULL, NULL, NULL, NOW()),
  ('General', 'GEN-04', 'VACANT',    NULL,            NULL, NULL, NULL, NOW()),
  ('General', 'GEN-05', 'OCCUPIED', 'Kavya Reddy',    NULL, 'Fever and respiratory infection',  NOW() - INTERVAL '2 days', NOW()),
  ('General', 'GEN-06', 'VACANT',    NULL,            NULL, NULL, NULL, NOW()),
  ('Pediatric', 'PED-01', 'OCCUPIED','Arjun Kumar (child)', NULL, 'Viral fever',                NOW() - INTERVAL '1 day',  NOW()),
  ('Pediatric', 'PED-02', 'VACANT',  NULL,            NULL, NULL, NULL, NOW()),
  ('Pediatric', 'PED-03', 'VACANT',  NULL,            NULL, NULL, NULL, NOW()),
  ('Maternity', 'MAT-01', 'OCCUPIED','Ananya Sharma', NULL, 'Pre-labour monitoring',            NOW() - INTERVAL '12 hours', NOW()),
  ('Maternity', 'MAT-02', 'VACANT',  NULL,            NULL, NULL, NULL, NOW()),
  ('Maternity', 'MAT-03', 'OCCUPIED','Deepa Nair',    NULL, 'Post-delivery recovery',           NOW() - INTERVAL '1 day',  NOW()),
  ('Emergency', 'EM-01', 'OCCUPIED', 'Unknown Male',  NULL, 'Road accident trauma',             NOW() - INTERVAL '3 hours', NOW()),
  ('Emergency', 'EM-02', 'VACANT',    NULL,           NULL, NULL, NULL, NOW()),
  ('Emergency', 'EM-03', 'VACANT',    NULL,           NULL, NULL, NULL, NOW()),
  ('Surgical', 'SUR-01', 'OCCUPIED', 'Ravi Gupta',   NULL, 'Post knee replacement surgery',    NOW() - INTERVAL '2 days', NOW()),
  ('Surgical', 'SUR-02', 'VACANT',    NULL,           NULL, NULL, NULL, NOW()),
  ('Surgical', 'SUR-03', 'MAINTENANCE', NULL,         NULL, NULL, NULL, NOW())
ON CONFLICT DO NOTHING;

-- ── Demo Audit Logs ───────────────────────────────────────────────────────────
INSERT INTO audit_logs (user_email, user_name, user_role, action, resource, ip_address, status, details, performed_at)
VALUES
  ('admin@hospital.com',  'Admin User', 'ADMIN',  'LOGIN',           'System',           '192.168.1.10', 'SUCCESS', 'Admin logged in',              NOW() - INTERVAL '2 hours'),
  ('doctor@hospital.com', 'Dr. Smith',  'DOCTOR', 'VIEW_PATIENT',    'Patient #3',       '192.168.1.11', 'SUCCESS', 'Viewed John Patient profile',  NOW() - INTERVAL '1 hour'),
  ('admin@hospital.com',  'Admin User', 'ADMIN',  'GENERATE_INVOICE','Invoice INV-2024-001', '192.168.1.10', 'SUCCESS', 'Generated invoice for Rahul Verma', NOW() - INTERVAL '50 minutes'),
  ('doctor@hospital.com', 'Dr. Smith',  'DOCTOR', 'UPDATE_VITALS',   'Patient #3',       '192.168.1.11', 'SUCCESS', 'Updated vitals for John Patient', NOW() - INTERVAL '45 minutes'),
  ('admin@hospital.com',  'Admin User', 'ADMIN',  'VIEW_AUDIT_LOG',  'Audit Log',        '192.168.1.10', 'SUCCESS', 'Admin accessed audit trail',   NOW() - INTERVAL '30 minutes'),
  ('patient@hospital.com','John Patient','PATIENT','SUBMIT_MOOD',    'Mood Log',         '192.168.1.12', 'SUCCESS', 'Patient submitted mood score: 8', NOW() - INTERVAL '20 minutes'),
  ('doctor@hospital.com', 'Dr. Smith',  'DOCTOR', 'DISCHARGE_PATIENT','Patient #3',     '192.168.1.11', 'SUCCESS', 'Approved discharge for John Patient', NOW() - INTERVAL '10 minutes'),
  ('admin@hospital.com',  'Admin User', 'ADMIN',  'UPDATE_PHARMACY', 'Amoxicillin 500mg','192.168.1.10', 'SUCCESS', 'Restocked 100 tablets',       NOW() - INTERVAL '5 minutes'),
  ('doctor@hospital.com', 'Dr. Smith',  'DOCTOR', 'LOGIN',           'System',           '192.168.1.11', 'SUCCESS', 'Doctor logged in',             NOW() - INTERVAL '3 minutes'),
  ('admin@hospital.com',  'Admin User', 'ADMIN',  'ASSIGN_BED',      'Bed ICU-01',       '192.168.1.10', 'SUCCESS', 'Assigned Rahul Verma to ICU-01', NOW() - INTERVAL '1 minute')
ON CONFLICT DO NOTHING;

SELECT 'MediPulse extended demo data inserted ✅' AS status;

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 3 — Seed data for new tables (family_contacts, telemedicine_sessions,
--           user_settings, discharge_summaries)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO family_contacts (patient_id, name, relation, phone, email, avatar, is_primary, status, alert_types, created_at) VALUES
  (3, 'Priya Sharma', 'Spouse',  '+91 98765 43210', 'priya@example.com', '👩', true,  'active',  'Medicine Reminders,Emergency Alerts,Appointment Alerts', NOW()),
  (3, 'Ravi Sharma',  'Parent',  '+91 87654 32109', 'ravi@example.com',  '👴', false, 'pending', 'Emergency Alerts', NOW())
ON CONFLICT DO NOTHING;

INSERT INTO telemedicine_sessions (patient_id, patient_name, doctor_name, specialty, doctor_icon, room_id, session_date, session_time, duration, type, status, duration_minutes, notes, created_at) VALUES
  (3,'John Patient','Dr. Priya Sharma','Cardiology','👩‍⚕️','MPX-3829','Today',    '3:00 PM', '20 min','Follow-up',   'ready',    0,  NULL,                                             NOW() + INTERVAL '3 hours'),
  (3,'John Patient','Dr. Arjun Mehta', 'Neurology', '👨‍⚕️','MPX-4421','Tomorrow', '10:30 AM','30 min','Consultation','scheduled',0,  NULL,                                             NOW() + INTERVAL '1 day'),
  (3,'John Patient','Dr. Priya Sharma','Cardiology','👩‍⚕️','MPX-2211','2026-02-20','3:00 PM','20 min','Follow-up',   'completed',18, 'Adjusted Metformin dosage. Check in 2 weeks.',  NOW() - INTERVAL '5 days'),
  (3,'John Patient','Dr. Arjun Mehta', 'Neurology', '👨‍⚕️','MPX-5544','2026-02-10','11:00 AM','25 min','Consultation','completed',25, 'MRI reviewed. No new lesions detected.',        NOW() - INTERVAL '15 days')
ON CONFLICT DO NOTHING;

INSERT INTO user_settings (user_id, medicine_alerts, mood_alerts, appointment_alerts, lab_alerts, health_tips, language, updated_at) VALUES
  (1, true,  true,  true,  true,  false, 'en', NOW()),
  (2, true,  true,  true,  true,  true,  'en', NOW()),
  (3, true,  true,  true,  true,  true,  'en', NOW())
ON CONFLICT DO NOTHING;

INSERT INTO discharge_summaries (patient_id, patient_name, age, gender, admission_date, discharge_date, admission_diagnosis, final_diagnosis, treatment_given, medications_on_discharge, doctor_name, follow_up_date, special_instructions, summary_text, created_at) VALUES
  (3,'John Patient','45','Male','2026-01-28','2026-01-30',
   'Acute febrile illness with dehydration',
   'Viral fever — resolved',
   'IV fluids 2L/day x 2 days, Paracetamol 1g TDS, Oral ORS',
   'Paracetamol 500mg TDS x 5 days, ORS sachets after each loose stool',
   'Dr. Smith','2026-02-14',
   'Avoid cold food. Rest 5 days. Return if fever > 103°F or severe headache.',
   'Patient presented with fever 104°F and dehydration. Managed with IV fluids and antipyretics. Discharged in stable condition with oral medications.',
   NOW() - INTERVAL '25 days')
ON CONFLICT DO NOTHING;

SELECT 'Phase 3 seed data inserted ✅' AS status;
