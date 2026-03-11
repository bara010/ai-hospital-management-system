package com.hospital.controller;

import com.hospital.ai.AINotificationService;
import com.hospital.model.Notification;
import com.hospital.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired private NotificationRepository notificationRepo;
    @Autowired private AINotificationService aiService;

    @GetMapping
    public List<Notification> getAll() { return notificationRepo.findAllByOrderByCreatedAtDesc(); }

    @GetMapping("/unread")
    public List<Notification> getUnread() { return notificationRepo.findByReadFalseOrderByCreatedAtDesc(); }

    @GetMapping("/count")
    public Map<String, Long> getCount() { return Map.of("count", notificationRepo.countByReadFalse()); }

    @GetMapping("/patient/{id}")
    public List<Notification> getForPatient(@PathVariable Long id) { return notificationRepo.findByPatientIdOrderByCreatedAtDesc(id); }

    @GetMapping("/patient/{id}/unread")
    public List<Notification> getUnreadForPatient(@PathVariable Long id) { return notificationRepo.findByPatientIdAndReadFalse(id); }

    @GetMapping("/patient/{id}/count")
    public Map<String, Long> countForPatient(@PathVariable Long id) { return Map.of("count", notificationRepo.countByPatientIdAndReadFalse(id)); }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id) {
        return notificationRepo.findById(id).map(n -> { n.setRead(true); notificationRepo.save(n); return ResponseEntity.ok().build(); })
               .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAll() { notificationRepo.markAllAsRead(); return ResponseEntity.ok().build(); }

    @PutMapping("/patient/{id}/read-all")
    public ResponseEntity<?> markAllPatient(@PathVariable Long id) { notificationRepo.markAllAsReadForPatient(id); return ResponseEntity.ok().build(); }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (notificationRepo.existsById(id)) { notificationRepo.deleteById(id); return ResponseEntity.ok().build(); }
        return ResponseEntity.notFound().build();
    }

    // Patient submits mood
    @PostMapping("/mood-response")
    public ResponseEntity<Map<String, Object>> submitMood(@RequestBody Map<String, Object> body) {
        Long patientId = Long.valueOf(body.get("patientId").toString());
        String patientName = (String) body.get("patientName");
        int moodScore = Integer.parseInt(body.get("moodScore").toString());
        String note = (String) body.getOrDefault("note", "");
        return ResponseEntity.ok(aiService.processMoodResponse(patientId, patientName, moodScore, note));
    }

    // Doctor sends health tip
    @PostMapping("/health-tip")
    public ResponseEntity<?> healthTip(@RequestBody Map<String, Object> body) {
        aiService.sendHealthTip(Long.valueOf(body.get("patientId").toString()),
            (String) body.get("doctorName"), (String) body.get("tip"));
        return ResponseEntity.ok(Map.of("message", "Health tip sent!"));
    }

    // Test triggers
    @PostMapping("/test/medicine-reminder")
    public ResponseEntity<?> testMedicine(@RequestBody Map<String, Object> body) {
        aiService.sendMedicineReminder(
            Long.valueOf(body.get("patientId").toString()),
            (String) body.get("patientName"),
            (String) body.get("medicineName"),
            (String) body.getOrDefault("dose", ""),
            (String) body.getOrDefault("timeOfDay", "morning")
        );
        return ResponseEntity.ok(Map.of("message", "Medicine reminder sent!"));
    }

    @PostMapping("/test/mood-check")
    public ResponseEntity<?> testMood(@RequestBody Map<String, Object> body) {
        aiService.sendMoodCheckRequest(Long.valueOf(body.get("patientId").toString()), (String) body.get("patientName"));
        return ResponseEntity.ok(Map.of("message", "Mood check sent!"));
    }

    @PostMapping("/test/appointment-reminder")
    public ResponseEntity<?> testAppt(@RequestBody Map<String, Object> body) {
        aiService.sendAppointmentReminder(
            Long.valueOf(body.get("patientId").toString()),
            (String) body.get("patientName"),
            (String) body.get("doctorName"),
            (String) body.get("dateTime"),
            (String) body.getOrDefault("hoursUntil", "24")
        );
        return ResponseEntity.ok(Map.of("message", "Appointment reminder sent!"));
    }

    // ── Doctor-specific unread notifications ─────────────────────────────────
    @GetMapping("/doctor/unread")
    public List<Notification> getDoctorUnread() {
        return notificationRepo.findByRecipientTypeAndReadFalse("DOCTOR");
    }
}
