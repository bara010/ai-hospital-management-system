package com.hospito.service;

import com.hospito.entity.MedicationPlan;
import com.hospito.entity.NotificationType;
import com.hospito.entity.User;
import com.hospito.repository.MedicationPlanRepository;
import com.hospito.repository.NotificationRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class MedicationReminderScheduler {

    private final MedicationPlanRepository medicationPlanRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    @Value("${hospito.medication-reminder.cooldown-minutes:45}")
    private long cooldownMinutes;

    public MedicationReminderScheduler(
            MedicationPlanRepository medicationPlanRepository,
            NotificationRepository notificationRepository,
            NotificationService notificationService
    ) {
        this.medicationPlanRepository = medicationPlanRepository;
        this.notificationRepository = notificationRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    @Scheduled(fixedDelayString = "${hospito.medication-reminder.interval-ms:300000}")
    public void sendMedicationReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();

        List<MedicationPlan> activePlans = medicationPlanRepository
                .findByActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByPatientIdAsc(today, today);

        for (MedicationPlan plan : activePlans) {
            ReminderWindow reminderWindow = resolveReminderWindow(plan, now);
            if (reminderWindow == null) {
                continue;
            }

            User recipient = plan.getPatient() == null ? null : plan.getPatient().getUser();
            if (recipient == null) {
                continue;
            }

            if (alreadyRemindedRecently(recipient.getId(), plan.getId())) {
                continue;
            }

            String title = reminderWindow.overdue() ? "Medication Reminder: Dose Overdue" : "Medication Reminder";
            String message = buildMessage(plan, reminderWindow);

            notificationService.createNotification(
                    recipient,
                    title,
                    message,
                    NotificationType.MEDICATION_REMINDER,
                    plan.getId()
            );
        }
    }

    private boolean alreadyRemindedRecently(Long recipientId, Long medicationPlanId) {
        Instant cutoff = Instant.now().minusSeconds(Math.max(5L, cooldownMinutes) * 60L);
        return notificationRepository.existsByRecipientIdAndTypeAndRelatedEntityIdAndCreatedAtAfter(
                recipientId,
                NotificationType.MEDICATION_REMINDER,
                medicationPlanId,
                cutoff
        );
    }

    private ReminderWindow resolveReminderWindow(MedicationPlan plan, LocalDateTime now) {
        if (plan == null || plan.getFrequencyPerDay() == null || plan.getStartDate() == null || plan.getEndDate() == null) {
            return null;
        }

        if (plan.getTotalDoses() == null || plan.getTotalDoses() <= 0) {
            return null;
        }

        int totalTaken = plan.getDosesTaken() == null ? 0 : plan.getDosesTaken();
        if (totalTaken >= plan.getTotalDoses()) {
            return null;
        }

        LocalDate today = now.toLocalDate();
        int frequency = Math.max(1, plan.getFrequencyPerDay());

        long elapsedDays = Duration.between(plan.getStartDate().atStartOfDay(), today.atStartOfDay()).toDays();
        if (elapsedDays < 0) {
            return null;
        }

        int expectedBeforeToday = safeInt(elapsedDays * frequency);
        int dosesTakenToday = clamp(totalTaken - expectedBeforeToday, 0, frequency);

        List<LocalTime> slots = buildDailySlots(frequency);
        if (slots.isEmpty()) {
            return null;
        }

        int nextDoseIndex = Math.min(dosesTakenToday, slots.size() - 1);
        LocalDateTime nextDue = LocalDateTime.of(today, slots.get(nextDoseIndex));

        LocalDateTime windowStart = nextDue.minusMinutes(10);
        LocalDateTime windowEnd = nextDue.plusHours(2);

        if (now.isBefore(windowStart) || now.isAfter(windowEnd)) {
            return null;
        }

        int expectedByNow = Math.min(
                plan.getTotalDoses(),
                expectedBeforeToday + countSlotsReached(slots, now.toLocalTime())
        );

        int missedDoses = Math.max(0, expectedByNow - totalTaken);
        boolean overdue = now.isAfter(nextDue.plusMinutes(15));

        return new ReminderWindow(nextDue, overdue, missedDoses);
    }

    private String buildMessage(MedicationPlan plan, ReminderWindow reminderWindow) {
        String medication = fallback(plan.getMedication(), "your medicine");
        String dosage = fallback(plan.getDosage(), "as prescribed");
        String doctor = plan.getDoctor() == null || plan.getDoctor().getUser() == null
                ? "your doctor"
                : "Dr. " + plan.getDoctor().getUser().getFullName();

        if (reminderWindow.overdue()) {
            String missedPart = reminderWindow.missedDoses() > 1
                    ? " You are behind by " + reminderWindow.missedDoses() + " doses."
                    : "";
            return "AI reminder: Your " + medication + " dose is overdue. Please take " + dosage
                    + " if medically advised." + missedPart + " Prescribed by " + doctor + ".";
        }

        return "AI reminder: It is time for " + medication + " (" + dosage + "). Prescribed by " + doctor + ".";
    }

    private List<LocalTime> buildDailySlots(int frequencyPerDay) {
        int frequency = Math.max(1, frequencyPerDay);
        List<LocalTime> slots = new ArrayList<>(frequency);

        if (frequency == 1) {
            slots.add(LocalTime.of(9, 0));
            return slots;
        }

        LocalTime start = LocalTime.of(8, 0);
        LocalTime end = LocalTime.of(22, 0);
        long windowMinutes = Duration.between(start, end).toMinutes();
        double step = (double) windowMinutes / (double) (frequency - 1);

        for (int i = 0; i < frequency; i++) {
            long minutes = Math.round(i * step);
            slots.add(start.plusMinutes(minutes));
        }

        return slots;
    }

    private int countSlotsReached(List<LocalTime> slots, LocalTime nowTime) {
        int reached = 0;
        for (LocalTime slot : slots) {
            if (!slot.isAfter(nowTime)) {
                reached++;
            }
        }
        return reached;
    }

    private int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    private int safeInt(long value) {
        if (value < Integer.MIN_VALUE) {
            return Integer.MIN_VALUE;
        }
        if (value > Integer.MAX_VALUE) {
            return Integer.MAX_VALUE;
        }
        return (int) value;
    }

    private String fallback(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }

    private record ReminderWindow(LocalDateTime dueTime, boolean overdue, int missedDoses) {
    }
}
