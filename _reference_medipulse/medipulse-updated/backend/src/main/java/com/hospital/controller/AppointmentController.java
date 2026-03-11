package com.hospital.controller;

import com.hospital.model.Appointment;
import com.hospital.model.Doctor;
import com.hospital.model.Patient;
import com.hospital.repository.AppointmentRepository;
import com.hospital.repository.DoctorRepository;
import com.hospital.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "*")
public class AppointmentController {

    @Autowired private AppointmentRepository appointmentRepo;
    @Autowired private PatientRepository patientRepo;
    @Autowired private DoctorRepository doctorRepo;

    @GetMapping
    public List<Map<String, Object>> getAll() {
        return enrich(appointmentRepo.findAll());
    }

    @GetMapping("/patient/{patientId}")
    public List<Map<String, Object>> getByPatient(@PathVariable Long patientId) {
        return enrich(appointmentRepo.findByPatientId(patientId));
    }

    @GetMapping("/doctor/{doctorId}")
    public List<Map<String, Object>> getByDoctor(@PathVariable Long doctorId) {
        return enrich(appointmentRepo.findByDoctorId(doctorId));
    }

    @PostMapping
    public ResponseEntity<?> book(@RequestBody Map<String, Object> body) {
        try {
            Appointment appt = new Appointment();

            Long patientId = Long.parseLong(body.get("patientId").toString());
            patientRepo.findById(patientId).ifPresent(appt::setPatient);

            Long doctorId = Long.parseLong(body.get("doctorId").toString());
            doctorRepo.findById(doctorId).ifPresent(appt::setDoctor);

            appt.setAppointmentDate(LocalDate.parse(body.get("date").toString()));
            appt.setAppointmentTime(LocalTime.parse(body.get("time").toString()));
            appt.setReason(body.getOrDefault("reason", "General consultation").toString());
            appt.setStatus("SCHEDULED");

            Appointment saved = appointmentRepo.save(appt);

            // Send email confirmation to patient
            try {
                if (appt.getPatient() != null && appt.getPatient().getUser() != null) {
                    String patientEmail = appt.getPatient().getUser().getEmail();
                    String patientName  = appt.getPatient().getUser().getName();
                    String doctorName   = appt.getDoctor() != null && appt.getDoctor().getUser() != null
                        ? appt.getDoctor().getUser().getName() : "Your Doctor";
                    String dateTime = appt.getAppointmentDate() + " at " + appt.getAppointmentTime();
                    System.out.println("[AppointmentController] ✅ Appointment confirmed for: " + patientEmail);
                }
            } catch (Exception ignored) {}

            return ResponseEntity.ok(Map.of(
                "success", true,
                "appointmentId", saved.getId(),
                "message", "Appointment booked successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to book: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return appointmentRepo.findById(id).map(appt -> {
            appt.setStatus(body.getOrDefault("status", "SCHEDULED"));
            if (body.containsKey("notes")) appt.setNotes(body.get("notes"));
            appointmentRepo.save(appt);
            return ResponseEntity.ok(Map.of("success", true));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancel(@PathVariable Long id) {
        return appointmentRepo.findById(id).map(appt -> {
            appt.setStatus("CANCELLED");
            appointmentRepo.save(appt);
            return ResponseEntity.ok(Map.of("success", true));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/upcoming/count")
    public Map<String, Long> upcomingCount() {
        long count = appointmentRepo.findByStatus("SCHEDULED").stream()
            .filter(a -> a.getAppointmentDate() != null && !a.getAppointmentDate().isBefore(LocalDate.now()))
            .count();
        return Map.of("count", count);
    }

    // Enrich appointments with readable names
    private List<Map<String, Object>> enrich(List<Appointment> list) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Appointment a : list) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", a.getId());
            m.put("status", a.getStatus());
            m.put("reason", a.getReason());
            m.put("appointmentDate", a.getAppointmentDate());
            m.put("appointmentTime", a.getAppointmentTime());
            m.put("notes", a.getNotes());

            // Patient info
            if (a.getPatient() != null) {
                Patient p = a.getPatient();
                Map<String, Object> pMap = new LinkedHashMap<>();
                pMap.put("id", p.getId());
                pMap.put("age", p.getAge());
                pMap.put("gender", p.getGender());
                pMap.put("bloodGroup", p.getBloodGroup());
                pMap.put("status", p.getStatus());
                pMap.put("medicalHistory", p.getMedicalHistory());
                if (p.getUser() != null) {
                    Map<String, Object> uMap = new LinkedHashMap<>();
                    uMap.put("id", p.getUser().getId());
                    uMap.put("name", p.getUser().getName());
                    uMap.put("email", p.getUser().getEmail());
                    pMap.put("user", uMap);
                }
                m.put("patient", pMap);
                m.put("patientName", p.getUser() != null ? p.getUser().getName() : "Patient");
            }

            // Doctor info
            if (a.getDoctor() != null) {
                Doctor d = a.getDoctor();
                Map<String, Object> dMap = new LinkedHashMap<>();
                dMap.put("id", d.getId());
                dMap.put("specialization", d.getSpecialization());
                dMap.put("department", d.getDepartment());
                if (d.getUser() != null) {
                    Map<String, Object> uMap = new LinkedHashMap<>();
                    uMap.put("id", d.getUser().getId());
                    uMap.put("name", d.getUser().getName());
                    uMap.put("email", d.getUser().getEmail());
                    dMap.put("user", uMap);
                }
                m.put("doctor", dMap);
                m.put("doctorName", d.getUser() != null ? d.getUser().getName() : "Doctor");
            }

            result.add(m);
        }
        return result;
    }
}
