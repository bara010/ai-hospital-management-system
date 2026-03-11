-- ================================================================
-- MediPulse Smart AI Features — Database Upgrade Script
-- Run AFTER Spring Boot has applied JPA schema changes
-- ================================================================

-- ── 1. Add new health columns to patients table ───────────────────
-- (Spring Boot @Column JPA will auto-add these on startup with ddl-auto=update)
-- Run manually ONLY if you use ddl-auto=none/validate:

ALTER TABLE patients ADD COLUMN IF NOT EXISTS weight_kg DOUBLE PRECISION DEFAULT 0;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS symptoms TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS symptom_duration VARCHAR(100);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS existing_diseases VARCHAR(1000);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_level VARCHAR(20) DEFAULT 'NORMAL';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS predicted_condition TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS suggested_department VARCHAR(50);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS severity_score INT DEFAULT 0;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_analyzed_at TIMESTAMP;

-- ── 2. Create health_history table ───────────────────────────────
CREATE TABLE IF NOT EXISTS health_history (
    id                  BIGINT PRIMARY KEY,
    patient_id          BIGINT REFERENCES patients(id),
    symptoms            TEXT,
    symptom_duration    VARCHAR(100),
    existing_diseases   VARCHAR(1000),
    emergency_level     VARCHAR(20),
    weight_kg           DOUBLE PRECISION,
    predicted_condition TEXT,
    suggested_department VARCHAR(50),
    severity_score      INT,
    recorded_at         TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_health_history_patient ON health_history(patient_id);

-- ── 3. Ensure doctors have department values ──────────────────────
-- Update existing doctors with proper department codes
UPDATE doctors SET department = 'CARDIOLOGY'       WHERE specialization ILIKE '%cardio%' AND (department IS NULL OR department = '');
UPDATE doctors SET department = 'GENERAL_MEDICINE'  WHERE specialization ILIKE '%general%' AND (department IS NULL OR department = '');
UPDATE doctors SET department = 'OPHTHALMOLOGY'     WHERE specialization ILIKE '%eye%' AND (department IS NULL OR department = '');
UPDATE doctors SET department = 'NEUROLOGY'         WHERE specialization ILIKE '%neuro%' AND (department IS NULL OR department = '');
UPDATE doctors SET department = 'ORTHOPEDICS'       WHERE specialization ILIKE '%ortho%' AND (department IS NULL OR department = '');
UPDATE doctors SET department = 'ENT'               WHERE specialization ILIKE '%ent%' AND (department IS NULL OR department = '');
UPDATE doctors SET department = 'DERMATOLOGY'       WHERE specialization ILIKE '%skin%' OR specialization ILIKE '%derma%';
UPDATE doctors SET department = 'PSYCHIATRY'        WHERE specialization ILIKE '%psych%';
UPDATE doctors SET department = 'DENTISTRY'         WHERE specialization ILIKE '%dental%' OR specialization ILIKE '%dent%';
UPDATE doctors SET department = 'PULMONOLOGY'       WHERE specialization ILIKE '%pulmo%' OR specialization ILIKE '%lung%';
UPDATE doctors SET department = 'GASTROENTEROLOGY'  WHERE specialization ILIKE '%gastro%';
UPDATE doctors SET department = 'ENDOCRINOLOGY'     WHERE specialization ILIKE '%endocrin%' OR specialization ILIKE '%diab%';
UPDATE doctors SET department = 'UROLOGY'           WHERE specialization ILIKE '%urol%';

-- Fallback: any doctor without department → GENERAL_MEDICINE
UPDATE doctors SET department = 'GENERAL_MEDICINE' WHERE department IS NULL OR department = '';

-- ── 4. Insert sample demo doctors for each department ────────────
-- First create demo users for each doctor (if not already present)
INSERT INTO users (email, password, name, role, phone, created_at) VALUES
  ('dr.heart@hospital.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Dr. Ravi Sharma',    'DOCTOR', '9800000001', NOW()),
  ('dr.eye@hospital.com',     '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Dr. Priya Nair',     'DOCTOR', '9800000002', NOW()),
  ('dr.neuro@hospital.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Dr. Arjun Verma',    'DOCTOR', '9800000003', NOW()),
  ('dr.ortho@hospital.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Dr. Kavya Iyer',     'DOCTOR', '9800000004', NOW()),
  ('dr.ent@hospital.com',     '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Dr. Suresh Pillai',  'DOCTOR', '9800000005', NOW()),
  ('dr.gastro@hospital.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Dr. Meena Patel',    'DOCTOR', '9800000006', NOW()),
  ('dr.pulmo@hospital.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Dr. Ajay Mishra',    'DOCTOR', '9800000007', NOW()),
  ('dr.skin@hospital.com',    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Dr. Lakshmi Devi',   'DOCTOR', '9800000008', NOW()),
  ('dr.psych@hospital.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Dr. Rohit Gupta',    'DOCTOR', '9800000009', NOW()),
  ('dr.dental@hospital.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Dr. Sneha Kumar',    'DOCTOR', '9800000010', NOW()),
  ('dr.endocrin@hospital.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Dr. Kiran Reddy',    'DOCTOR', '9800000011', NOW()),
  ('dr.urology@hospital.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Dr. Ganesh Rao',     'DOCTOR', '9800000012', NOW()),
  ('dr.general@hospital.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Dr. Ananya Singh',   'DOCTOR', '9800000013', NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert doctor profiles (using subquery to get user IDs)
INSERT INTO doctors (user_id, specialization, department, qualification, availability, consultation_fee) VALUES
  ((SELECT id FROM users WHERE email='dr.heart@hospital.com'),   'Cardiologist',         'CARDIOLOGY',       'MD Cardiology, DM', 'MON-SAT 9AM-4PM', 800.0),
  ((SELECT id FROM users WHERE email='dr.eye@hospital.com'),     'Ophthalmologist',      'OPHTHALMOLOGY',    'MS Ophthalmology',  'MON-FRI 10AM-5PM',600.0),
  ((SELECT id FROM users WHERE email='dr.neuro@hospital.com'),   'Neurologist',          'NEUROLOGY',        'DM Neurology',      'TUE-SAT 9AM-3PM', 900.0),
  ((SELECT id FROM users WHERE email='dr.ortho@hospital.com'),   'Orthopedic Surgeon',   'ORTHOPEDICS',      'MS Orthopedics',    'MON-FRI 8AM-2PM', 700.0),
  ((SELECT id FROM users WHERE email='dr.ent@hospital.com'),     'ENT Specialist',       'ENT',              'MS ENT',            'MON-SAT 9AM-5PM', 500.0),
  ((SELECT id FROM users WHERE email='dr.gastro@hospital.com'),  'Gastroenterologist',   'GASTROENTEROLOGY', 'DM Gastro',         'MON-FRI 11AM-5PM',750.0),
  ((SELECT id FROM users WHERE email='dr.pulmo@hospital.com'),   'Pulmonologist',        'PULMONOLOGY',      'DM Pulmonology',    'MON-SAT 8AM-2PM', 700.0),
  ((SELECT id FROM users WHERE email='dr.skin@hospital.com'),    'Dermatologist',        'DERMATOLOGY',      'MD Dermatology',    'MON-FRI 10AM-4PM',550.0),
  ((SELECT id FROM users WHERE email='dr.psych@hospital.com'),   'Psychiatrist',         'PSYCHIATRY',       'MD Psychiatry',     'MON-FRI 9AM-3PM', 850.0),
  ((SELECT id FROM users WHERE email='dr.dental@hospital.com'),  'Dentist',              'DENTISTRY',        'BDS, MDS',          'MON-SAT 9AM-6PM', 400.0),
  ((SELECT id FROM users WHERE email='dr.endocrin@hospital.com'),'Endocrinologist',      'ENDOCRINOLOGY',    'DM Endocrinology',  'TUE-SAT 10AM-4PM',800.0),
  ((SELECT id FROM users WHERE email='dr.urology@hospital.com'), 'Urologist',            'UROLOGY',          'MCh Urology',       'MON-FRI 9AM-3PM', 750.0),
  ((SELECT id FROM users WHERE email='dr.general@hospital.com'), 'General Physician',    'GENERAL_MEDICINE', 'MBBS, MD',          'MON-SAT 8AM-8PM', 300.0)
ON CONFLICT DO NOTHING;

SELECT 'Smart Features DB Upgrade Complete ✅' AS status;
SELECT department, COUNT(*) AS doctors FROM doctors GROUP BY department ORDER BY department;
