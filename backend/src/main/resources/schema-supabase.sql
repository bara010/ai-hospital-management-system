-- HOSPITO Supabase (PostgreSQL) schema

CREATE SEQUENCE IF NOT EXISTS users_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS patient_profiles_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS doctor_profiles_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS doctor_availability_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS appointments_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS medical_records_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS prescriptions_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS notifications_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS doctor_ratings_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS chat_messages_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS audit_logs_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS billing_records_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS lab_orders_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS medication_plans_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS reminder_dispatches_seq START 1 INCREMENT 1;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY DEFAULT nextval('users_seq'),
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL,
    totp_secret VARCHAR(100),
    totp_enabled BOOLEAN DEFAULT FALSE,
    fcm_token VARCHAR(500),
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS patient_profiles (
    id BIGINT PRIMARY KEY DEFAULT nextval('patient_profiles_seq'),
    user_id BIGINT NOT NULL UNIQUE,
    date_of_birth DATE,
    blood_group VARCHAR(5),
    address VARCHAR(500),
    allergies VARCHAR(1000),
    height_cm NUMERIC(6, 2),
    weight_kg NUMERIC(6, 2),
    emergency_contact_name VARCHAR(120),
    emergency_contact_phone VARCHAR(20),
    profile_photo_path VARCHAR(350),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    CONSTRAINT fk_patient_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS doctor_profiles (
    id BIGINT PRIMARY KEY DEFAULT nextval('doctor_profiles_seq'),
    user_id BIGINT NOT NULL UNIQUE,
    specialization VARCHAR(150) NOT NULL,
    qualification VARCHAR(200),
    years_experience INTEGER,
    bio VARCHAR(1500),
    availability_notes VARCHAR(500),
    profile_photo_path VARCHAR(350),
    approval_status VARCHAR(20) NOT NULL,
    rating_average NUMERIC(3, 2) NOT NULL DEFAULT 0,
    rating_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    CONSTRAINT fk_doctor_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS doctor_availability (
    id BIGINT PRIMARY KEY DEFAULT nextval('doctor_availability_seq'),
    doctor_id BIGINT NOT NULL,
    day_of_week SMALLINT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    CONSTRAINT fk_availability_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_profiles(id)
);

CREATE TABLE IF NOT EXISTS appointments (
    id BIGINT PRIMARY KEY DEFAULT nextval('appointments_seq'),
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    reason VARCHAR(1000),
    status VARCHAR(20) NOT NULL,
    meeting_room_id VARCHAR(80),
    reminder_sent BOOLEAN DEFAULT FALSE,
    cancellation_reason VARCHAR(500),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    CONSTRAINT fk_appointment_patient FOREIGN KEY (patient_id) REFERENCES patient_profiles(id),
    CONSTRAINT fk_appointment_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_profiles(id)
);

CREATE TABLE IF NOT EXISTS medical_records (
    id BIGINT PRIMARY KEY DEFAULT nextval('medical_records_seq'),
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT,
    appointment_id BIGINT,
    record_date DATE NOT NULL,
    diagnosis VARCHAR(1000),
    notes VARCHAR(4000),
    report_path VARCHAR(350),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    CONSTRAINT fk_record_patient FOREIGN KEY (patient_id) REFERENCES patient_profiles(id),
    CONSTRAINT fk_record_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_profiles(id),
    CONSTRAINT fk_record_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

CREATE TABLE IF NOT EXISTS prescriptions (
    id BIGINT PRIMARY KEY DEFAULT nextval('prescriptions_seq'),
    appointment_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    medication VARCHAR(500) NOT NULL,
    dosage VARCHAR(200) NOT NULL,
    instructions VARCHAR(2000) NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    CONSTRAINT fk_prescription_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    CONSTRAINT fk_prescription_patient FOREIGN KEY (patient_id) REFERENCES patient_profiles(id),
    CONSTRAINT fk_prescription_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_profiles(id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT PRIMARY KEY DEFAULT nextval('notifications_seq'),
    recipient_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    type VARCHAR(50) NOT NULL,
    related_entity_id BIGINT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    CONSTRAINT fk_notification_user FOREIGN KEY (recipient_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGINT PRIMARY KEY DEFAULT nextval('chat_messages_seq'),
    sender_id BIGINT NOT NULL,
    recipient_id BIGINT NOT NULL,
    message_text VARCHAR(2000),
    attachment_path VARCHAR(500),
    attachment_name VARCHAR(300),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    CONSTRAINT fk_chat_sender FOREIGN KEY (sender_id) REFERENCES users(id),
    CONSTRAINT fk_chat_recipient FOREIGN KEY (recipient_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS doctor_ratings (
    id BIGINT PRIMARY KEY DEFAULT nextval('doctor_ratings_seq'),
    doctor_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    appointment_id BIGINT NOT NULL,
    rating INTEGER NOT NULL,
    review VARCHAR(1000),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    CONSTRAINT fk_rating_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_profiles(id),
    CONSTRAINT fk_rating_patient FOREIGN KEY (patient_id) REFERENCES patient_profiles(id),
    CONSTRAINT fk_rating_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    CONSTRAINT uk_rating_patient_appointment UNIQUE (patient_id, appointment_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT PRIMARY KEY DEFAULT nextval('audit_logs_seq'),
    actor_user_id BIGINT,
    actor_email VARCHAR(150),
    actor_role VARCHAR(30),
    action VARCHAR(120) NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id BIGINT,
    details VARCHAR(2000),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS billing_records (
    id BIGINT PRIMARY KEY DEFAULT nextval('billing_records_seq'),
    patient_id BIGINT NOT NULL,
    appointment_id BIGINT,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(5) NOT NULL DEFAULT 'INR',
    insurance_provider VARCHAR(150),
    insurance_policy_number VARCHAR(120),
    insurance_coverage_amount NUMERIC(12, 2),
    patient_payable_amount NUMERIC(12, 2) NOT NULL,
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL,
    description VARCHAR(1000),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    CONSTRAINT fk_billing_patient FOREIGN KEY (patient_id) REFERENCES patient_profiles(id),
    CONSTRAINT fk_billing_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

CREATE TABLE IF NOT EXISTS lab_orders (
    id BIGINT PRIMARY KEY DEFAULT nextval('lab_orders_seq'),
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    appointment_id BIGINT,
    test_name VARCHAR(250) NOT NULL,
    instructions VARCHAR(1000),
    status VARCHAR(30) NOT NULL,
    status_note VARCHAR(500),
    result_summary VARCHAR(4000),
    result_file_path VARCHAR(350),
    result_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    CONSTRAINT fk_lab_patient FOREIGN KEY (patient_id) REFERENCES patient_profiles(id),
    CONSTRAINT fk_lab_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_profiles(id),
    CONSTRAINT fk_lab_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

CREATE TABLE IF NOT EXISTS medication_plans (
    id BIGINT PRIMARY KEY DEFAULT nextval('medication_plans_seq'),
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    appointment_id BIGINT,
    medication VARCHAR(500) NOT NULL,
    dosage VARCHAR(200) NOT NULL,
    instructions VARCHAR(2000),
    frequency_per_day INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_doses INTEGER NOT NULL,
    doses_taken INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    last_taken_at TIMESTAMP,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    CONSTRAINT fk_medication_patient FOREIGN KEY (patient_id) REFERENCES patient_profiles(id),
    CONSTRAINT fk_medication_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_profiles(id),
    CONSTRAINT fk_medication_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

CREATE TABLE IF NOT EXISTS reminder_dispatches (
    id BIGINT PRIMARY KEY DEFAULT nextval('reminder_dispatches_seq'),
    appointment_id BIGINT NOT NULL,
    recipient_id BIGINT NOT NULL,
    stage VARCHAR(30) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    delivered BOOLEAN NOT NULL DEFAULT FALSE,
    provider_message_id VARCHAR(200),
    failure_reason VARCHAR(1000),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    CONSTRAINT fk_reminder_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    CONSTRAINT fk_reminder_recipient FOREIGN KEY (recipient_id) REFERENCES users(id),
    CONSTRAINT uk_reminder_dispatch_unique UNIQUE (appointment_id, recipient_id, stage, channel)
);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_time ON appointments(doctor_id, start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_time ON appointments(patient_id, start_time);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_chat_sender_recipient_time ON chat_messages(sender_id, recipient_id, created_at);
