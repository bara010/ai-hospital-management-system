package com.hospital.scheduler;

import com.hospital.ai.AINotificationService;
import com.hospital.repository.MedicineScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalTime;

@Component
public class NotificationSchedulers {

    @Autowired private AINotificationService aiService;
    @Autowired private MedicineScheduleRepository medicineScheduleRepo;

    // ── Medicine reminder — runs every minute ─────────────────────────────
    @Scheduled(cron = "0 * * * * *")
    public void medicineReminders() {
        LocalTime now = LocalTime.now();
        medicineScheduleRepo.findByReminderHourAndReminderMinuteAndActiveTrue(now.getHour(), now.getMinute())
            .forEach(s -> aiService.sendMedicineReminder(s.getPatientId(), s.getPatientName(),
                s.getMedicineName(), s.getDose(), s.getTimeOfDay()));
    }

    // ── Daily mood check — 9 AM ───────────────────────────────────────────
    @Scheduled(cron = "0 0 9 * * *")
    public void dailyMoodCheck() {
        // Sends mood check to all patients in DB
        // You can expand this with actual patient repo query
        System.out.println("[Scheduler] Daily mood check triggered at 9 AM");
    }

    // ── Stock check — 8 AM ────────────────────────────────────────────────
    @Scheduled(cron = "0 0 8 * * *")
    public void stockCheck() {
        System.out.println("[Scheduler] Daily stock check triggered at 8 AM");
    }
}
