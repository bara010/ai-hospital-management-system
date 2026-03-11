package com.hospito.service;

import com.hospito.entity.Appointment;
import com.hospito.entity.User;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    private static final DateTimeFormatter APPOINTMENT_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${hospito.email.enabled:false}")
    private boolean emailEnabled;

    @Value("${hospito.email.from:no-reply@hospito.local}")
    private String fromEmail;

    public EmailService(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSenderProvider = mailSenderProvider;
    }

    public void sendAppointmentBookedToDoctor(Appointment appointment) {
        if (!emailEnabled || appointment == null) {
            return;
        }

        User doctorUser = appointment.getDoctor() == null ? null : appointment.getDoctor().getUser();
        User patientUser = appointment.getPatient() == null ? null : appointment.getPatient().getUser();

        if (doctorUser == null || doctorUser.getEmail() == null || doctorUser.getEmail().isBlank()) {
            return;
        }

        String patientName = patientUser == null ? "Patient" : patientUser.getFullName();
        String subject = "HOSPITO: New Appointment Booking";
        String body = """
                Dear Dr. %s,

                A new appointment has been booked.

                Patient: %s
                Start Time: %s
                End Time: %s
                Reason: %s

                Please review this appointment in your HOSPITO dashboard.
                """
                .formatted(
                        doctorUser.getFullName(),
                        patientName,
                        appointment.getStartTime() == null ? "-" : appointment.getStartTime().format(APPOINTMENT_TIME_FORMATTER),
                        appointment.getEndTime() == null ? "-" : appointment.getEndTime().format(APPOINTMENT_TIME_FORMATTER),
                        appointment.getReason() == null || appointment.getReason().isBlank() ? "Not specified" : appointment.getReason()
                );

        send(doctorUser.getEmail(), subject, body);
    }

    public void send(String to, String subject, String body) {
        if (!emailEnabled || to == null || to.isBlank()) {
            return;
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception ignored) {
            // Email failures must not break primary business flow.
        }
    }
}
