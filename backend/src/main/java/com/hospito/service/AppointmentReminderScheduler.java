package com.hospito.service;

import com.hospito.entity.*;
import com.hospito.repository.AppointmentRepository;
import com.hospito.repository.ReminderDispatchRepository;
import jakarta.transaction.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class AppointmentReminderScheduler {

    private final AppointmentRepository appointmentRepository;
    private final ReminderDispatchRepository reminderDispatchRepository;
    private final NotificationService notificationService;
    private final ReminderChannelService reminderChannelService;

    public AppointmentReminderScheduler(
            AppointmentRepository appointmentRepository,
            ReminderDispatchRepository reminderDispatchRepository,
            NotificationService notificationService,
            ReminderChannelService reminderChannelService
    ) {
        this.appointmentRepository = appointmentRepository;
        this.reminderDispatchRepository = reminderDispatchRepository;
        this.notificationService = notificationService;
        this.reminderChannelService = reminderChannelService;
    }

    @Transactional
    @Scheduled(fixedDelayString = "${hospito.reminder.interval-ms:300000}")
    public void sendReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime upperWindow = now.plusHours(2);

        List<Appointment> appointments = appointmentRepository
                .findByStatusAndStartTimeBetweenOrderByStartTimeAsc(AppointmentStatus.APPROVED, now, upperWindow);

        for (Appointment appointment : appointments) {
            ReminderStage stage = resolveStage(now, appointment.getStartTime());
            if (stage == null) {
                continue;
            }

            dispatchStage(appointment, appointment.getPatient().getUser(), appointment.getDoctor().getUser(), stage, true);
            dispatchStage(appointment, appointment.getDoctor().getUser(), appointment.getPatient().getUser(), stage, false);

            if (stage == ReminderStage.T_MINUS_10) {
                appointment.setReminderSent(true);
            }
        }

        if (!appointments.isEmpty()) {
            appointmentRepository.saveAll(appointments);
        }
    }

    private ReminderStage resolveStage(LocalDateTime now, LocalDateTime startTime) {
        long minutes = Duration.between(now, startTime).toMinutes();

        if (minutes < 0) {
            return null;
        }

        if (minutes <= 10) {
            return ReminderStage.T_MINUS_10;
        }
        if (minutes <= 30) {
            return ReminderStage.T_MINUS_30;
        }
        if (minutes <= 120) {
            return ReminderStage.T_MINUS_120;
        }
        return null;
    }

    private void dispatchStage(
            Appointment appointment,
            User recipient,
            User counterpart,
            ReminderStage stage,
            boolean recipientIsPatient
    ) {
        String timeLabel = appointment.getStartTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        String stageLabel = stageLabel(stage);

        String title = "Consultation Reminder";
        String message = recipientIsPatient
                ? "Your consultation with Dr. " + counterpart.getFullName() + " starts in " + stageLabel + " at " + timeLabel
                : "Consultation with " + counterpart.getFullName() + " starts in " + stageLabel + " at " + timeLabel;

        dispatchFcm(appointment, recipient, stage, title, message);

        if (stage == ReminderStage.T_MINUS_30 || stage == ReminderStage.T_MINUS_10) {
            dispatchSms(appointment, recipient, stage, message);
        }

        if (stage == ReminderStage.T_MINUS_10) {
            dispatchWhatsApp(appointment, recipient, stage, message);
        }
    }

    private void dispatchFcm(Appointment appointment, User recipient, ReminderStage stage, String title, String message) {
        if (alreadyDispatched(appointment, recipient, stage, ReminderChannel.FCM)) {
            return;
        }

        notificationService.createNotification(
                recipient,
                title,
                message,
                NotificationType.CONSULTATION_REMINDER,
                appointment.getId()
        );

        saveDispatch(appointment, recipient, stage, ReminderChannel.FCM, ChannelDeliveryResult.delivered(null));
    }

    private void dispatchSms(Appointment appointment, User recipient, ReminderStage stage, String message) {
        if (alreadyDispatched(appointment, recipient, stage, ReminderChannel.SMS)) {
            return;
        }

        ChannelDeliveryResult result = reminderChannelService.sendSms(recipient.getPhone(), message);
        saveDispatch(appointment, recipient, stage, ReminderChannel.SMS, result);
    }

    private void dispatchWhatsApp(Appointment appointment, User recipient, ReminderStage stage, String message) {
        if (alreadyDispatched(appointment, recipient, stage, ReminderChannel.WHATSAPP)) {
            return;
        }

        ChannelDeliveryResult result = reminderChannelService.sendWhatsApp(recipient.getPhone(), message);
        saveDispatch(appointment, recipient, stage, ReminderChannel.WHATSAPP, result);
    }

    private boolean alreadyDispatched(Appointment appointment, User recipient, ReminderStage stage, ReminderChannel channel) {
        return reminderDispatchRepository.existsByAppointmentIdAndRecipientIdAndStageAndChannel(
                appointment.getId(),
                recipient.getId(),
                stage,
                channel
        );
    }

    private void saveDispatch(
            Appointment appointment,
            User recipient,
            ReminderStage stage,
            ReminderChannel channel,
            ChannelDeliveryResult result
    ) {
        ReminderDispatch dispatch = new ReminderDispatch();
        dispatch.setAppointment(appointment);
        dispatch.setRecipient(recipient);
        dispatch.setStage(stage);
        dispatch.setChannel(channel);
        dispatch.setDelivered(result.delivered());
        dispatch.setProviderMessageId(result.providerMessageId());
        dispatch.setFailureReason(result.failureReason());
        reminderDispatchRepository.save(dispatch);
    }

    private String stageLabel(ReminderStage stage) {
        return switch (stage) {
            case T_MINUS_120 -> "2 hours";
            case T_MINUS_30 -> "30 minutes";
            case T_MINUS_10 -> "10 minutes";
        };
    }
}
