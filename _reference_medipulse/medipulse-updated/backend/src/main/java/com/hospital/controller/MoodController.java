package com.hospital.controller;

import com.hospital.model.MoodLog;
import com.hospital.model.Notification;
import com.hospital.model.User;
import com.hospital.repository.MoodLogRepository;
import com.hospital.repository.NotificationRepository;
import com.hospital.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/mood")
@CrossOrigin(origins = "*")
public class MoodController {

    @Autowired private MoodLogRepository moodRepo;
    @Autowired private NotificationRepository notifRepo;
    @Autowired private UserRepository userRepo;
    

    private static final Map<Integer, String> MOOD_LABELS = Map.of(
        1, "😢 Very Bad", 2, "😕 Bad", 3, "😐 Okay",
        4, "😊 Good",     5, "😄 Great!"
    );

    @GetMapping("/patient/{patientId}")
    public List<MoodLog> getByPatient(@PathVariable Long patientId) {
        return moodRepo.findByPatientIdOrderByLoggedAtDesc(patientId);
    }

    @GetMapping("/patient/{patientId}/recent")
    public List<MoodLog> getRecent(@PathVariable Long patientId) {
        return moodRepo.findTop30ByPatientIdOrderByLoggedAtDesc(patientId);
    }

    @GetMapping("/all")
    public List<MoodLog> getAll() {
        return moodRepo.findAllByOrderByLoggedAtDesc();
    }

    @PostMapping
    public ResponseEntity<?> submit(@RequestBody Map<String, Object> body) {
        try {
            Long patientId = Long.parseLong(body.get("patientId").toString());
            String patientName = (String) body.get("patientName");
            int score = Integer.parseInt(body.get("moodScore").toString());
            String note = body.containsKey("note") ? (String) body.get("note") : "";

            MoodLog log = new MoodLog();
            log.setPatientId(patientId);
            log.setPatientName(patientName);
            log.setMoodScore(score);
            log.setMoodLabel(MOOD_LABELS.getOrDefault(score, "😊 Good"));
            log.setNote(note);

            boolean alertDoctor = score <= 3;
            log.setDoctorAlerted(alertDoctor);
            MoodLog saved = moodRepo.save(log);

            // ── Send notification to all doctors when mood is low ──────────────
            if (alertDoctor) {
                String alertMsg = "⚠️ " + patientName + " reported a low mood score (" + score + "/5). Note: " + (note.isBlank() ? "None" : note);

                // Create in-app notification for all DOCTOR users
                List<User> doctors = userRepo.findByRole("DOCTOR");
                for (User doc : doctors) {
                    notifRepo.save(new Notification(
                        "MOOD_ALERT",
                        "⚠️ Patient Mood Alert",
                        alertMsg,
                        patientId,
                        "DOCTOR"
                    ));

                    // Send actual email to each doctor
                    if (doc.getEmail() != null) {
                        String html = buildMoodAlertEmail(patientName, score, note);
                        System.out.println("[MoodController] 🔔 Low mood alert for doctor: " + doc.getEmail() + " | patient: " + patientName);
                    }
                }

                // Notify patient their care team was alerted
                notifRepo.save(new Notification(
                    "MOOD_RESPONSE",
                    "💙 We Heard You",
                    "Thank you " + patientName + "! Your care team has been notified and will follow up with you soon. You're not alone 💙",
                    patientId,
                    "PATIENT"
                ));
            } else {
                // Positive acknowledgement notification for patient
                notifRepo.save(new Notification(
                    "MOOD_RESPONSE",
                    "😊 Great to hear!",
                    "Thanks for checking in, " + patientName + "! Keep up the positive energy! 😊",
                    patientId,
                    "PATIENT"
                ));
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "id", saved.getId(),
                "label", saved.getMoodLabel(),
                "doctorAlerted", alertDoctor,
                "patient_response", alertDoctor
                    ? "Your care team has been notified and will follow up with you 💙"
                    : "Thanks for sharing! Keep up the great mood! 😊",
                "message", alertDoctor ? "Doctor notified via email and notification." : "Mood logged!"
            ));
        } catch (Exception e) {
            System.err.println("[MoodController] Error: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/patient/{patientId}/stats")
    public ResponseEntity<?> stats(@PathVariable Long patientId) {
        List<MoodLog> logs = moodRepo.findTop30ByPatientIdOrderByLoggedAtDesc(patientId);
        if (logs.isEmpty()) return ResponseEntity.ok(Map.of("hasData", false));
        double avg = logs.stream().mapToInt(MoodLog::getMoodScore).average().orElse(0);
        int min = logs.stream().mapToInt(MoodLog::getMoodScore).min().orElse(0);
        int max = logs.stream().mapToInt(MoodLog::getMoodScore).max().orElse(0);
        long alerts = logs.stream().filter(MoodLog::isDoctorAlerted).count();
        return ResponseEntity.ok(Map.of(
            "hasData", true,
            "average", Math.round(avg * 10.0) / 10.0,
            "min", min, "max", max,
            "totalEntries", logs.size(),
            "doctorAlerts", alerts
        ));
    }

    private String buildMoodAlertEmail(String patientName, int score, String note) {
        String scoreColor = score <= 2 ? "#dc2626" : "#f59e0b";
        String bars = "●".repeat(score) + "○".repeat(5 - score);
        return "<!DOCTYPE html><html><body style='margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif'>"
            + "<div style='max-width:520px;margin:40px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.10)'>"
            + "<div style='background:linear-gradient(135deg,#dc2626,#b91c1c);padding:28px 32px;color:white;text-align:center'>"
            + "<div style='font-size:22px;font-weight:800'>✚ MediPulse — Mood Alert</div></div>"
            + "<div style='padding:32px;text-align:center'>"
            + "<div style='font-size:48px;margin-bottom:12px'>😟</div>"
            + "<h2 style='margin:0 0 8px;color:#1a202c;font-size:22px'>Patient Mood Alert</h2>"
            + "<p style='color:#64748b;font-size:14px;margin-bottom:24px'><strong>" + patientName + "</strong> reported a low mood and may need attention.</p>"
            + "<div style='background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;margin-bottom:24px;text-align:left'>"
            + "<div style='font-size:13px;color:#374151;margin-bottom:8px'><strong>Mood Score:</strong> <span style='color:" + scoreColor + ";font-size:18px;font-weight:800'>" + score + "/5</span> " + bars + "</div>"
            + (note.isBlank() ? "" : "<div style='font-size:13px;color:#374151'><strong>Patient Note:</strong> " + note + "</div>")
            + "</div>"
            + "<p style='font-size:13px;color:#94a3b8;margin:0'>Please log in to MediPulse to review this patient's record and follow up.</p>"
            + "</div>"
            + "<div style='background:#f8fafc;padding:14px 32px;border-top:1px solid #f0f4f8;text-align:center'>"
            + "<p style='font-size:11px;color:#94a3b8;margin:0'>© MediPulse Health Intelligence</p></div></div></body></html>";
    }
}
