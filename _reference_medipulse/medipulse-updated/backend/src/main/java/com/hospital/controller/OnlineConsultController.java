package com.hospital.controller;

import com.hospital.model.Doctor;
import com.hospital.model.Notification;
import com.hospital.model.OnlineConsult;
import com.hospital.model.User;
import com.hospital.repository.DoctorRepository;
import com.hospital.repository.NotificationRepository;
import com.hospital.repository.OnlineConsultRepository;
import com.hospital.repository.UserRepository;
import com.hospital.service.SymptomAnalysisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/online-consult")
@CrossOrigin(origins = "*")
public class OnlineConsultController {

    @Autowired private OnlineConsultRepository consultRepo;
    @Autowired private NotificationRepository  notifRepo;
    @Autowired private UserRepository          userRepo;
    @Autowired private DoctorRepository        doctorRepo;

    // ── Patient: request a new consult ─────────────────────────────────────
    @PostMapping("/request")
    public ResponseEntity<?> request(@RequestBody Map<String, Object> body) {
        try {
            OnlineConsult c = new OnlineConsult();
            c.setPatientId(Long.parseLong(body.get("patientId").toString()));
            c.setPatientName(body.getOrDefault("patientName", "Patient").toString());
            c.setSymptoms(body.getOrDefault("symptoms", "").toString());
            c.setStatus("WAITING");
            OnlineConsult saved = consultRepo.save(c);

            // Notify ALL doctors (recipientType DOCTOR, patientId null)
            Notification n = new Notification(
                "ONLINE_CONSULT_REQUEST",
                "🟢 New Online Consult Request",
                c.getPatientName() + " is requesting an online consultation. Symptoms: " + c.getSymptoms(),
                null, "DOCTOR"
            );
            n.setPatientId(c.getPatientId());
            notifRepo.save(n);

            // Email all doctors
            try {
                List<User> doctors = userRepo.findByRole("DOCTOR");
                for (User doc : doctors) {
                    if (doc.getEmail() != null) {
                        System.out.println("[OnlineConsultController] 🔔 Consult request notification");
                    }
                }
            } catch (Exception ignored) {}

            return ResponseEntity.ok(Map.of("success", true, "id", saved.getId(), "status", "WAITING"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Doctor: accept a waiting consult ───────────────────────────────────
    @PutMapping("/{id}/accept")
    public ResponseEntity<?> accept(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return consultRepo.findById(id).map(c -> {
            c.setStatus("ACCEPTED");
            c.setAcceptedAt(LocalDateTime.now());

            // Look up real doctor profile by userId
            Long userId = body.containsKey("userId")
                ? Long.parseLong(body.get("userId").toString()) : null;
            Long doctorProfileId = body.containsKey("doctorId")
                ? Long.parseLong(body.get("doctorId").toString()) : null;
            String doctorName = body.getOrDefault("doctorName", "Doctor").toString();

            // Try to find doctor profile from DB for full info
            Doctor docProfile = null;
            if (userId != null) {
                docProfile = doctorRepo.findByUser_Id(userId).orElse(null);
            }
            if (docProfile == null && doctorProfileId != null) {
                docProfile = doctorRepo.findById(doctorProfileId).orElse(null);
            }

            if (docProfile != null) {
                c.setDoctorId(docProfile.getId());
                c.setDoctorName(docProfile.getUser() != null ? docProfile.getUser().getName() : doctorName);
                c.setDoctorDepartment(docProfile.getDepartment());
                c.setDoctorSpecialization(docProfile.getSpecialization());
                c.setDoctorQualification(docProfile.getQualification());
                c.setDoctorFee(docProfile.getConsultationFee());
            } else {
                c.setDoctorId(doctorProfileId);
                c.setDoctorName(doctorName);
            }

            consultRepo.save(c);

            // Notify patient with real doctor name
            Notification n = new Notification(
                "ONLINE_CONSULT_ACCEPTED",
                "✅ Doctor Joined Your Consult",
                "Dr. " + c.getDoctorName() + " has accepted your request and joined the consultation.",
                c.getPatientId(), "PATIENT"
            );
            notifRepo.save(n);
            return ResponseEntity.ok(Map.of("success", true));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Send a chat message ─────────────────────────────────────────────────
    @PostMapping("/{id}/message")
    public ResponseEntity<?> sendMessage(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return consultRepo.findById(id).map(c -> {
            try {
                // Parse existing chat
                String raw = c.getChatJson();
                List<Map<String, Object>> chat = parseChat(raw);

                Map<String, Object> msg = new LinkedHashMap<>();
                msg.put("sender",   body.get("sender"));
                msg.put("senderName", body.get("senderName"));
                msg.put("text",     body.get("text"));
                msg.put("time",     LocalDateTime.now().toString());
                chat.add(msg);

                c.setChatJson(toJson(chat));
                if ("ACCEPTED".equals(c.getStatus())) {
                    c.setStatus("IN_PROGRESS");
                }
                consultRepo.save(c);

                // Notify the other party
                String sender = body.getOrDefault("sender", "").toString();
                if ("PATIENT".equals(sender) && c.getDoctorId() != null) {
                    Notification n = new Notification(
                        "ONLINE_CONSULT_MESSAGE",
                        "💬 Patient sent a message",
                        c.getPatientName() + ": " + body.get("text"),
                        c.getPatientId(), "DOCTOR"
                    );
                    notifRepo.save(n);
                } else if ("DOCTOR".equals(sender)) {
                    Notification n = new Notification(
                        "ONLINE_CONSULT_MESSAGE",
                        "💬 Doctor replied",
                        "Dr. " + c.getDoctorName() + ": " + body.get("text"),
                        c.getPatientId(), "PATIENT"
                    );
                    notifRepo.save(n);
                }
                return ResponseEntity.ok(Map.of("success", true, "chatJson", c.getChatJson()));
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── End consult ─────────────────────────────────────────────────────────
    @PutMapping("/{id}/end")
    public ResponseEntity<?> end(@PathVariable Long id) {
        return consultRepo.findById(id).map(c -> {
            c.setStatus("COMPLETED");
            c.setEndedAt(LocalDateTime.now());
            consultRepo.save(c);

            Notification n = new Notification(
                "ONLINE_CONSULT_ENDED",
                "🏁 Consultation Completed",
                "Your online consultation with Dr. " + (c.getDoctorName() != null ? c.getDoctorName() : "the doctor") + " has ended.",
                c.getPatientId(), "PATIENT"
            );
            notifRepo.save(n);
            return ResponseEntity.ok(Map.of("success", true));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Get consult by id ───────────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return consultRepo.findById(id)
            .map(c -> ResponseEntity.ok(toMap(c)))
            .orElse(ResponseEntity.notFound().build());
    }

    // ── Get patient's consults ──────────────────────────────────────────────
    @GetMapping("/patient/{patientId}")
    public List<Map<String, Object>> byPatient(@PathVariable Long patientId) {
        return consultRepo.findByPatientIdOrderByCreatedAtDesc(patientId).stream().map(this::toMap).toList();
    }

    // ── Get all waiting (for doctors to see) ───────────────────────────────
    @GetMapping("/waiting")
    public List<Map<String, Object>> waiting() {
        return consultRepo.findByStatusOrderByCreatedAtAsc("WAITING").stream().map(this::toMap).toList();
    }

    // ── Get doctor's active consults ────────────────────────────────────────
    @GetMapping("/doctor/{doctorId}")
    public List<Map<String, Object>> byDoctor(@PathVariable Long doctorId) {
        return consultRepo.findByDoctorIdOrderByCreatedAtDesc(doctorId).stream().map(this::toMap).toList();
    }

    // ── Cancel ──────────────────────────────────────────────────────────────
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancel(@PathVariable Long id) {
        return consultRepo.findById(id).map(c -> {
            c.setStatus("CANCELLED");
            consultRepo.save(c);
            return ResponseEntity.ok(Map.of("success", true));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Helpers ─────────────────────────────────────────────────────────────
    private Map<String, Object> toMap(OnlineConsult c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",                   c.getId());
        m.put("patientId",            c.getPatientId());
        m.put("patientName",          c.getPatientName());
        m.put("doctorId",             c.getDoctorId());
        m.put("doctorName",           c.getDoctorName());
        m.put("doctorDepartment",     c.getDoctorDepartment());
        m.put("doctorSpecialization", c.getDoctorSpecialization());
        m.put("doctorQualification",  c.getDoctorQualification());
        m.put("doctorFee",            c.getDoctorFee());
        m.put("doctorDeptLabel",      c.getDoctorDepartment() != null
            ? SymptomAnalysisService.deptLabel(c.getDoctorDepartment()) : null);
        m.put("symptoms",    c.getSymptoms());
        m.put("status",      c.getStatus());
        m.put("chatJson",    c.getChatJson());
        m.put("createdAt",   c.getCreatedAt()  != null ? c.getCreatedAt().toString()  : null);
        m.put("acceptedAt",  c.getAcceptedAt() != null ? c.getAcceptedAt().toString() : null);
        m.put("endedAt",     c.getEndedAt()    != null ? c.getEndedAt().toString()    : null);
        return m;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> parseChat(String json) {
        // Minimal JSON array parser — avoids adding Jackson dependency explicitly
        if (json == null || json.isBlank() || json.equals("[]")) return new ArrayList<>();
        try {
            com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
            return om.readValue(json, List.class);
        } catch (Exception e) { return new ArrayList<>(); }
    }

    private String toJson(Object obj) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
            return om.writeValueAsString(obj);
        } catch (Exception e) { return "[]"; }
    }
}
