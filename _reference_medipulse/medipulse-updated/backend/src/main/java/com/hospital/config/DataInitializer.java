package com.hospital.config;

import com.hospital.model.*;
import com.hospital.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired private UserRepository        userRepo;
    @Autowired private PatientRepository     patientRepo;
    @Autowired private DoctorRepository      doctorRepo;
    @Autowired private AppointmentRepository appointmentRepo;
    @Autowired private NotificationRepository notifRepo;
    @Autowired private MedicineScheduleRepository medRepo;
    @Autowired private VitalRecordRepository vitalRepo;
    @Autowired private MoodLogRepository     moodRepo;
    @Autowired private PharmacyItemRepository pharmacyRepo;
    @Autowired private BedRecordRepository   bedRepo;
    @Autowired private AuditLogRepository    auditRepo;
    @Autowired private InvoiceRepository     invoiceRepo;
    @Autowired private UserSettingsRepository settingsRepo;
    @Autowired private PasswordEncoder       passwordEncoder;

    @Override
    public void run(String... args) {
        try {
            if (userRepo.count() > 0) {
                System.out.println("✅ Database already has data — skipping seed.");
                return;
            }
        } catch (Exception e) {
            System.err.println("⚠️  Cannot check DB: " + e.getMessage());
            System.err.println("   Run oracle_setup.sql first, then restart.");
            return;
        }

        System.out.println("🌱 Seeding data...");

        try {
            String pw = passwordEncoder.encode("password123");

            // ── Users ──────────────────────────────────────────────────
            User admin = userRepo.save(new User("admin@hospital.com", pw, "Admin User", "ADMIN"));
            User doc1User = userRepo.save(new User("doctor@hospital.com", pw, "Dr. Arjun Sharma", "DOCTOR"));
            User doc2User = userRepo.save(new User("doctor2@hospital.com", pw, "Dr. Priya Nair", "DOCTOR"));
            User doc3User = userRepo.save(new User("doctor3@hospital.com", pw, "Dr. Kavita Menon", "DOCTOR"));
            User doc4User = userRepo.save(new User("doctor4@hospital.com", pw, "Dr. Rahul Gupta", "DOCTOR"));
            User doc5User = userRepo.save(new User("doctor5@hospital.com", pw, "Dr. Sunita Reddy", "DOCTOR"));
            User doc6User = userRepo.save(new User("doctor6@hospital.com", pw, "Dr. Vikram Joshi", "DOCTOR"));
            User pat1User = userRepo.save(new User("patient@hospital.com", pw, "John Patient", "PATIENT"));
            User pat2User = userRepo.save(new User("patient2@hospital.com", pw, "Riya Mehta", "PATIENT"));
            User pat3User = userRepo.save(new User("patient3@hospital.com", pw, "Vikram Singh", "PATIENT"));
            System.out.println("✅ Users seeded");

            // ── Doctor profiles ─────────────────────────────────────────
            Doctor doc1 = new Doctor();
            doc1.setUser(doc1User); doc1.setSpecialization("General Medicine");
            doc1.setDepartment("GENERAL_MEDICINE"); doc1.setQualification("MBBS, MD");
            doc1.setAvailability("MON-FRI 9AM-5PM"); doc1.setConsultationFee(500.0);
            doctorRepo.save(doc1);

            Doctor doc2 = new Doctor();
            doc2.setUser(doc2User); doc2.setSpecialization("Interventional Cardiology");
            doc2.setDepartment("CARDIOLOGY"); doc2.setQualification("MBBS, DM Cardiology");
            doc2.setAvailability("MON-WED 10AM-4PM"); doc2.setConsultationFee(800.0);
            doctorRepo.save(doc2);

            Doctor doc3 = new Doctor();
            doc3.setUser(doc3User); doc3.setSpecialization("Orthopaedic Surgery");
            doc3.setDepartment("ORTHOPAEDICS"); doc3.setQualification("MBBS, MS Ortho");
            doc3.setAvailability("TUE-SAT 9AM-3PM"); doc3.setConsultationFee(700.0);
            doctorRepo.save(doc3);

            Doctor doc4 = new Doctor();
            doc4.setUser(doc4User); doc4.setSpecialization("Paediatrics");
            doc4.setDepartment("PAEDIATRICS"); doc4.setQualification("MBBS, MD Paediatrics");
            doc4.setAvailability("MON-FRI 8AM-2PM"); doc4.setConsultationFee(600.0);
            doctorRepo.save(doc4);

            Doctor doc5 = new Doctor();
            doc5.setUser(doc5User); doc5.setSpecialization("Dermatology & Cosmetology");
            doc5.setDepartment("DERMATOLOGY"); doc5.setQualification("MBBS, MD Dermatology");
            doc5.setAvailability("MON-THU 11AM-5PM"); doc5.setConsultationFee(650.0);
            doctorRepo.save(doc5);

            Doctor doc6 = new Doctor();
            doc6.setUser(doc6User); doc6.setSpecialization("Neurology");
            doc6.setDepartment("NEUROLOGY"); doc6.setQualification("MBBS, DM Neurology");
            doc6.setAvailability("WED-SUN 10AM-4PM"); doc6.setConsultationFee(900.0);
            doctorRepo.save(doc6);
            System.out.println("✅ Doctors seeded");

            // ── Patient profiles ─────────────────────────────────────────
            Patient pat1 = new Patient();
            pat1.setUser(pat1User); pat1.setAge(45); pat1.setGender("Male");
            pat1.setAddress("123 Main St, Mumbai"); pat1.setBloodGroup("B+");
            pat1.setMedicalHistory("Type 2 Diabetes, Hypertension");
            pat1.setHasChronic(true); pat1.setPrevAdmissions(2); pat1.setStatus("OUTPATIENT");
            patientRepo.save(pat1);

            Patient pat2 = new Patient();
            pat2.setUser(pat2User); pat2.setAge(32); pat2.setGender("Female");
            pat2.setAddress("45 Park Lane, Pune"); pat2.setBloodGroup("O+");
            pat2.setMedicalHistory("Asthma, Allergic Rhinitis");
            pat2.setHasChronic(false); pat2.setPrevAdmissions(1); pat2.setStatus("OUTPATIENT");
            patientRepo.save(pat2);

            Patient pat3 = new Patient();
            pat3.setUser(pat3User); pat3.setAge(60); pat3.setGender("Male");
            pat3.setAddress("78 Lake View, Chennai"); pat3.setBloodGroup("A-");
            pat3.setMedicalHistory("Coronary Artery Disease, Post-bypass surgery");
            pat3.setHasChronic(true); pat3.setPrevAdmissions(5); pat3.setStatus("OUTPATIENT");
            patientRepo.save(pat3);
            System.out.println("✅ Patients seeded");

            // ── Appointments ─────────────────────────────────────────────
            try {
                // John → Doc1 (upcoming)
                Appointment a1 = new Appointment();
                a1.setPatient(pat1); a1.setDoctor(doc1);
                a1.setAppointmentDate(LocalDate.now().plusDays(2));
                a1.setAppointmentTime(LocalTime.of(10, 0));
                a1.setStatus("SCHEDULED"); a1.setReason("Diabetes follow-up");
                appointmentRepo.save(a1);

                // John → Doc1 (past)
                Appointment a2 = new Appointment();
                a2.setPatient(pat1); a2.setDoctor(doc1);
                a2.setAppointmentDate(LocalDate.now().minusDays(10));
                a2.setAppointmentTime(LocalTime.of(9, 0));
                a2.setStatus("COMPLETED"); a2.setReason("Blood pressure review");
                appointmentRepo.save(a2);

                // Riya → Doc1
                Appointment a3 = new Appointment();
                a3.setPatient(pat2); a3.setDoctor(doc1);
                a3.setAppointmentDate(LocalDate.now().plusDays(5));
                a3.setAppointmentTime(LocalTime.of(11, 30));
                a3.setStatus("SCHEDULED"); a3.setReason("Asthma management");
                appointmentRepo.save(a3);

                // Vikram → Doc2 (cardiology)
                Appointment a4 = new Appointment();
                a4.setPatient(pat3); a4.setDoctor(doc2);
                a4.setAppointmentDate(LocalDate.now().plusDays(1));
                a4.setAppointmentTime(LocalTime.of(14, 0));
                a4.setStatus("SCHEDULED"); a4.setReason("Cardiac check-up");
                appointmentRepo.save(a4);

                // Today's appointment (for admin dashboard)
                Appointment a5 = new Appointment();
                a5.setPatient(pat1); a5.setDoctor(doc1);
                a5.setAppointmentDate(LocalDate.now());
                a5.setAppointmentTime(LocalTime.of(15, 0));
                a5.setStatus("SCHEDULED"); a5.setReason("General consultation");
                appointmentRepo.save(a5);

                System.out.println("✅ Appointments seeded");
            } catch (Exception e) { System.err.println("⚠️ Appointment seed failed: " + e.getMessage()); }

            // ── Notifications ────────────────────────────────────────────
            try {
                notifRepo.save(new Notification("MEDICINE_REMINDER", "💊 Medicine Reminder",
                    "Good morning John! Time to take your Metformin 500mg.", pat1.getId(), "PATIENT"));
                notifRepo.save(new Notification("APPOINTMENT_REMINDER", "📅 Appointment Tomorrow",
                    "You have an appointment with Dr. Arjun Sharma tomorrow at 10:00 AM. Be on time!", pat1.getId(), "PATIENT"));
                notifRepo.save(new Notification("MOOD_CHECK", "💙 How Are You Feeling?",
                    "Hey Riya! How are you feeling today? Tap to let your doctor know.", pat2.getId(), "PATIENT"));
                notifRepo.save(new Notification("MOOD_ALERT", "⚠️ Patient Mood Alert",
                    "John Patient reported a mood score of 2/5. May need follow-up.", pat1.getId(), "DOCTOR"));
                notifRepo.save(new Notification("STOCK", "🏪 Stock Alert",
                    "Insulin (Rapid Acting) is OUT OF STOCK. Order immediately!", null, "DOCTOR"));
                System.out.println("✅ Notifications seeded");
            } catch (Exception e) { System.err.println("⚠️ Notification seed failed: " + e.getMessage()); }

            // ── Medicine Schedules ────────────────────────────────────────
            try {
                String[][] meds = {
                    {"Metformin","500mg","morning","8","0"},
                    {"Amlodipine","5mg","morning","9","30"},
                    {"Aspirin","75mg","evening","20","0"},
                };
                for (String[] m : meds) {
                    MedicineSchedule ms = new MedicineSchedule();
                    ms.setPatientId(pat1.getId()); ms.setPatientName("John Patient");
                    ms.setMedicineName(m[0]); ms.setDose(m[1]); ms.setTimeOfDay(m[2]);
                    ms.setReminderHour(Integer.parseInt(m[3])); ms.setReminderMinute(Integer.parseInt(m[4]));
                    ms.setActive(true); medRepo.save(ms);
                }
                System.out.println("✅ Medicine schedules seeded");
            } catch (Exception e) { System.err.println("⚠️ Medicine seed failed: " + e.getMessage()); }

            // ── Vital Records ─────────────────────────────────────────────
            try {
                int[][] bps = {{128,84},{132,86},{125,82},{130,85},{127,83},{124,81},{126,82}};
                double[] sugars = {110.5,118.0,105.0,122.0,108.0,103.0,106.5};
                for (int i = 0; i < bps.length; i++) {
                    VitalRecord v = new VitalRecord();
                    v.setPatientId(pat1.getId());
                    v.setSystolic(bps[i][0]); v.setDiastolic(bps[i][1]);
                    v.setBloodSugar(sugars[i]); v.setSpo2(98);
                    v.setHeartRate(72); v.setTemperature(36.9); v.setWeight(72.0);
                    v.setRecordedAt(LocalDateTime.now().minusDays(6 - i));
                    vitalRepo.save(v);
                }
                System.out.println("✅ Vital records seeded");
            } catch (Exception e) { System.err.println("⚠️ Vitals seed failed: " + e.getMessage()); }

            // ── Mood Logs ─────────────────────────────────────────────────
            try {
                int[] scores = {4,5,2,4,5,4,5};
                String[] labels = {"Good","Great","Low","Good","Great","Good","Great"};
                for (int i = 0; i < scores.length; i++) {
                    MoodLog ml = new MoodLog();
                    ml.setPatientId(pat1.getId()); ml.setPatientName("John Patient");
                    ml.setMoodScore(scores[i]); ml.setMoodLabel(labels[i]);
                    ml.setDoctorAlerted(scores[i] <= 3);
                    ml.setLoggedAt(LocalDateTime.now().minusDays(6 - i));
                    moodRepo.save(ml);
                }
                System.out.println("✅ Mood logs seeded");
            } catch (Exception e) { System.err.println("⚠️ Mood seed failed: " + e.getMessage()); }

            // ── Pharmacy Items ────────────────────────────────────────────
            try {
                Object[][] pharma = {
                    {"Amoxicillin 500mg","Antibiotic","MedSupply Co",45,50,12.50,"tablets","LOW"},
                    {"Metformin 500mg","Antidiabetic","PharmaCorp",280,100,8.00,"tablets","OK"},
                    {"Amlodipine 5mg","Cardiovascular","HealthDist",160,80,15.00,"tablets","OK"},
                    {"Paracetamol 500mg","Painkiller","MedSupply Co",520,200,3.50,"tablets","OK"},
                    {"Insulin (Rapid Acting)","Antidiabetic","BioPharm",0,30,185.00,"vials","CRITICAL"},
                    {"Azithromycin 500mg","Antibiotic","MedSupply Co",28,40,32.00,"tablets","LOW"},
                    {"IV Saline 500ml","IV Fluid","FluidMed",75,100,45.00,"bags","LOW"},
                    {"Aspirin 75mg","Cardiovascular","PharmaCorp",350,100,5.00,"tablets","OK"},
                };
                for (Object[] p : pharma) {
                    PharmacyItem pi = new PharmacyItem();
                    pi.setName((String)p[0]); pi.setCategory((String)p[1]); pi.setSupplier((String)p[2]);
                    pi.setStock((Integer)p[3]); pi.setMinStock((Integer)p[4]);
                    pi.setUnitPrice((Double)p[5]); pi.setUnit((String)p[6]);
                    pi.setExpiryDate(LocalDate.of(2027, 6, 30)); pi.setStockStatus((String)p[7]);
                    pharmacyRepo.save(pi);
                }
                System.out.println("✅ Pharmacy items seeded");
            } catch (Exception e) { System.err.println("⚠️ Pharmacy seed failed: " + e.getMessage()); }

            // ── Bed Records ───────────────────────────────────────────────
            try {
                Object[][] beds = {
                    {"ICU","ICU-01","OCCUPIED","Rahul Verma","Post-cardiac surgery"},
                    {"ICU","ICU-02","OCCUPIED","Priya Singh","Severe pneumonia"},
                    {"ICU","ICU-03","VACANT",null,null},
                    {"General","GEN-01","OCCUPIED","Mohammed Shaikh","Diabetes management"},
                    {"General","GEN-02","OCCUPIED","Sunita Patel","Post appendectomy"},
                    {"General","GEN-03","VACANT",null,null},
                    {"General","GEN-04","VACANT",null,null},
                    {"Pediatric","PED-01","OCCUPIED","Arjun Kumar","Viral fever"},
                    {"Pediatric","PED-02","VACANT",null,null},
                    {"Maternity","MAT-01","OCCUPIED","Ananya Sharma","Pre-labour monitoring"},
                    {"Emergency","EM-01","OCCUPIED","Unknown Male","Road accident trauma"},
                    {"Emergency","EM-02","VACANT",null,null},
                    {"Surgical","SUR-01","OCCUPIED","Ravi Gupta","Post knee replacement"},
                    {"Surgical","SUR-02","VACANT",null,null},
                };
                for (Object[] b : beds) {
                    BedRecord br = new BedRecord();
                    br.setWard((String)b[0]); br.setBedNumber((String)b[1]); br.setStatus((String)b[2]);
                    br.setPatientName((String)b[3]); br.setAdmittedFor((String)b[4]);
                    if ("OCCUPIED".equals(b[2])) br.setAdmittedAt(LocalDateTime.now().minusDays(1));
                    bedRepo.save(br);
                }
                System.out.println("✅ Bed records seeded");
            } catch (Exception e) { System.err.println("⚠️ Bed seed failed: " + e.getMessage()); }

            // ── Invoices ──────────────────────────────────────────────────
            try {
                Object[][] invs = {
                    {"INV-2024-001","John Patient","PT-1001","Dr. Arjun Sharma","[{\"name\":\"Consultation\",\"qty\":1,\"price\":500},{\"name\":\"CBC\",\"qty\":1,\"price\":250}]",750.0,38.0,788.0,"PAID"},
                    {"INV-2024-002","Riya Mehta","PT-1002","Dr. Arjun Sharma","[{\"name\":\"Specialist Consult\",\"qty\":1,\"price\":800}]",800.0,40.0,840.0,"PENDING"},
                    {"INV-2024-003","Vikram Singh","PT-1003","Dr. Priya Nair","[{\"name\":\"Cardiac Consult\",\"qty\":1,\"price\":800},{\"name\":\"ECG\",\"qty\":1,\"price\":600}]",1400.0,70.0,1470.0,"OVERDUE"},
                };
                for (Object[] inv : invs) {
                    Invoice i = new Invoice();
                    i.setInvoiceNumber((String)inv[0]); i.setPatientName((String)inv[1]);
                    i.setPatientIdCode((String)inv[2]); i.setDoctorName((String)inv[3]);
                    i.setItemsJson((String)inv[4]);
                    i.setSubtotal((Double)inv[5]); i.setTax((Double)inv[6]); i.setTotal((Double)inv[7]);
                    i.setStatus((String)inv[8]); invoiceRepo.save(i);
                }
                System.out.println("✅ Invoices seeded");
            } catch (Exception e) { System.err.println("⚠️ Invoice seed failed: " + e.getMessage()); }

            // ── Audit Logs ────────────────────────────────────────────────
            try {
                auditRepo.save(new AuditLog("admin@hospital.com","Admin User","ADMIN","LOGIN","System","SUCCESS","Admin logged in"));
                auditRepo.save(new AuditLog("doctor@hospital.com","Dr. Arjun Sharma","DOCTOR","VIEW_PATIENT","Patient #1","SUCCESS","Viewed John Patient profile"));
                auditRepo.save(new AuditLog("patient@hospital.com","John Patient","PATIENT","SUBMIT_MOOD","Mood Log","SUCCESS","Patient submitted mood score: 2"));
                System.out.println("✅ Audit logs seeded");
            } catch (Exception e) { System.err.println("⚠️ Audit seed failed: " + e.getMessage()); }

            // ── User Settings ─────────────────────────────────────────────
            try {
                for (User u : userRepo.findAll()) {
                    UserSettings s = new UserSettings();
                    s.setUserId(u.getId()); settingsRepo.save(s);
                }
                System.out.println("✅ User settings seeded");
            } catch (Exception e) { System.err.println("⚠️ Settings seed failed: " + e.getMessage()); }

            System.out.println("╔═══════════════════════════════════════════════════╗");
            System.out.println("║  ✅ Data seeded!                                  ║");
            System.out.println("║  📧 admin@hospital.com / password123              ║");
            System.out.println("║  📧 doctor@hospital.com / password123             ║");
            System.out.println("║  📧 doctor2@hospital.com / password123            ║");
            System.out.println("║  📧 patient@hospital.com / password123            ║");
            System.out.println("║  📧 patient2@hospital.com / password123           ║");
            System.out.println("║  📧 patient3@hospital.com / password123           ║");
            System.out.println("╚═══════════════════════════════════════════════════╝");

        } catch (Exception e) {
            System.err.println("❌ Seed failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
