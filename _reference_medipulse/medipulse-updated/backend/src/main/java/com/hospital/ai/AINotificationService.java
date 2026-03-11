package com.hospital.ai;

import com.hospital.model.Notification;
import com.hospital.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@Service
public class AINotificationService {

    @Value("${ai.service.url}")
    private String aiUrl;

    @Autowired private NotificationRepository notificationRepo;
    private final RestTemplate restTemplate = new RestTemplate();

    public void sendMedicineReminder(Long patientId, String patientName, String medicineName, String dose, String timeOfDay) {
        try {
            Map<String, Object> payload = Map.of("patient_name", patientName, "medicine_name", medicineName, "dose", dose, "time_of_day", timeOfDay);
            ResponseEntity<Map> res = restTemplate.postForEntity(aiUrl + "/generate/medicine-reminder", payload, Map.class);
            save("MEDICINE_REMINDER", (String) res.getBody().get("title"), (String) res.getBody().get("message"), patientId, "PATIENT");
        } catch (Exception e) {
            save("MEDICINE_REMINDER", "💊 Medicine Reminder", "Time to take your " + medicineName + " " + dose + "!", patientId, "PATIENT");
        }
    }

    public void sendMoodCheckRequest(Long patientId, String patientName) {
        String msg = "Hey " + patientName + "! 😊 How are you feeling today? Tap to let your doctor know. Your health matters to us! 💙";
        save("MOOD_CHECK", "😊 How Are You Feeling?", msg, patientId, "PATIENT");
    }

    public Map<String, Object> processMoodResponse(Long patientId, String patientName, int moodScore, String note) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("mood_score", moodScore); payload.put("patient_name", patientName); payload.put("note", note);
            ResponseEntity<Map> res = restTemplate.postForEntity(aiUrl + "/analyze/mood", payload, Map.class);
            Map<String, Object> result = res.getBody();
            if (Boolean.TRUE.equals(result.get("notify_doctor"))) {
                save("MOOD_ALERT", "⚠️ Patient Mood Alert", (String) result.get("doctor_notification"), patientId, "DOCTOR");
            }
            save("MOOD_RESPONSE", "💙 We Heard You", (String) result.get("patient_response"), patientId, "PATIENT");
            return result;
        } catch (Exception e) {
            return Map.of("patient_response", "Thank you for sharing! Stay well 💙");
        }
    }

    public void sendAppointmentReminder(Long patientId, String patientName, String doctorName, String dateTime, String hoursUntil) {
        String title = hoursUntil.equals("24") ? "📅 Appointment Tomorrow!" : "📅 Appointment in 1 Hour!";
        String msg = hoursUntil.equals("24")
            ? "Hi " + patientName + "! You have an appointment with " + doctorName + " tomorrow at " + dateTime + ". Please be on time! 🏥"
            : "⏰ " + patientName + ", your appointment with " + doctorName + " is in 1 hour (" + dateTime + "). Head out soon! 🚗";
        save("APPOINTMENT_REMINDER", title, msg, patientId, "PATIENT");
        // Also send Brevo push notification
        System.out.println("[AINotificationService] Notification skipped");
    }

    public void sendHealthTip(Long patientId, String doctorName, String tip) {
        save("HEALTH_TIP", "🏥 Health Tip From Your Doctor", "💡 Dr. " + doctorName + ": " + tip, patientId, "PATIENT");
    }

    public void checkReadmissionRisk(Long patientId, int age, int prevAdmissions, int stayDays, int numMeds, int numDiagnoses, boolean chronic) {
        Map<String, Object> p = Map.of("age", age, "num_prev_admissions", prevAdmissions, "length_of_stay", stayDays,
            "num_medications", numMeds, "num_diagnoses", numDiagnoses, "has_chronic_disease", chronic ? 1 : 0);
        callAI("/predict/readmission", p, "READMISSION", "🏥 Readmission Risk Alert", patientId, "DOCTOR");
    }

    public void checkNoShowRisk(Long patientId, int age, double distKm, int prevNoShows, int daysUntil, int hour) {
        Map<String, Object> p = Map.of("age", age, "distance_km", distKm, "prev_noshow_count", prevNoShows, "days_until_appt", daysUntil, "appointment_hour", hour);
        callAI("/predict/noshow", p, "NOSHOW", "📅 No-Show Risk Alert", patientId, "DOCTOR");
    }

    public void checkLabAlert(Long patientId, Map<String, Object> labValues) {
        callAI("/predict/lab-alert", labValues, "LAB_ALERT", "🧪 Critical Lab Alert", patientId, "DOCTOR");
    }

    public void runStockCheck(List<Map<String, Object>> medicines) {
        callAI("/predict/stock-alert", Map.of("medicines", medicines), "STOCK", "💊 Stock Alert", null, "DOCTOR");
    }

    @SuppressWarnings("unchecked")
    private void callAI(String endpoint, Map<String, Object> payload, String type, String title, Long patientId, String recipientType) {
        try {
            ResponseEntity<Map> res = restTemplate.postForEntity(aiUrl + endpoint, payload, Map.class);
            Map<String, Object> body = res.getBody();
            if (body != null && Boolean.TRUE.equals(body.get("notify"))) {
                save(type, title, body.get("message").toString(), patientId, recipientType);
            }
        } catch (Exception e) {
            System.err.println("[AI] Warning: " + e.getMessage());
        }
    }

    public void save(String type, String title, String message, Long patientId, String recipientType) {
        notificationRepo.save(new Notification(type, title, message, patientId, recipientType));
    }
}
