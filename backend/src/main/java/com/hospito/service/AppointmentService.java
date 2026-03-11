package com.hospito.service;

import com.hospito.dto.AppointmentBookRequest;
import com.hospito.dto.AppointmentResponse;
import com.hospito.dto.AppointmentSlotResponse;
import com.hospito.dto.AppointmentStatusUpdateRequest;
import com.hospito.entity.*;
import com.hospito.exception.BadRequestException;
import com.hospito.exception.ForbiddenException;
import com.hospito.exception.ResourceNotFoundException;
import com.hospito.repository.AppointmentRepository;
import com.hospito.repository.DoctorAvailabilityRepository;
import com.hospito.repository.DoctorProfileRepository;
import com.hospito.repository.PatientProfileRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AppointmentService {

    private static final long SLOT_MINUTES = 30L;

    private final AppointmentRepository appointmentRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final DoctorAvailabilityRepository doctorAvailabilityRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final AuditService auditService;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            PatientProfileRepository patientProfileRepository,
            DoctorProfileRepository doctorProfileRepository,
            DoctorAvailabilityRepository doctorAvailabilityRepository,
            NotificationService notificationService,
            EmailService emailService,
            AuditService auditService
    ) {
        this.appointmentRepository = appointmentRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.doctorAvailabilityRepository = doctorAvailabilityRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.auditService = auditService;
    }

    @Transactional
    public AppointmentResponse bookAppointment(Long patientUserId, AppointmentBookRequest request) {
        PatientProfile patient = patientProfileRepository.findByUserId(patientUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        DoctorProfile doctor = doctorProfileRepository.findById(request.doctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        if (doctor.getApprovalStatus() != DoctorApprovalStatus.APPROVED) {
            throw new BadRequestException("Doctor is not approved for appointments yet");
        }

        if (!request.startTime().isBefore(request.endTime())) {
            throw new BadRequestException("Appointment start time must be before end time");
        }

        validateSlotBoundary(request.startTime(), request.endTime());
        validateAvailability(doctor, request.startTime(), request.endTime());

        boolean conflict = appointmentRepository.existsByDoctorIdAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
                doctor.getId(),
                List.of(AppointmentStatus.PENDING, AppointmentStatus.APPROVED),
                request.endTime(),
                request.startTime()
        );

        if (conflict) {
            throw new BadRequestException("Selected slot is already booked");
        }

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setStartTime(request.startTime());
        appointment.setEndTime(request.endTime());
        appointment.setReason(request.reason());
        appointment.setStatus(AppointmentStatus.PENDING);
        appointment.setMeetingRoomId("room-" + UUID.randomUUID());

        Appointment saved = appointmentRepository.save(appointment);

        notificationService.createNotification(
                doctor.getUser(),
                "New Appointment Request",
                "Appointment requested by " + patient.getUser().getFullName(),
                NotificationType.APPOINTMENT_BOOKED,
                saved.getId()
        );

        notificationService.createNotification(
                patient.getUser(),
                "Appointment Booked",
                "Your appointment request has been sent to Dr. " + doctor.getUser().getFullName(),
                NotificationType.APPOINTMENT_BOOKED,
                saved.getId()
        );

        emailService.sendAppointmentBookedToDoctor(saved);

        auditService.log(
                patient.getUser(),
                "APPOINTMENT_BOOKED",
                "APPOINTMENT",
                saved.getId(),
                "Requested appointment with doctorId=" + doctor.getId()
        );

        return toResponse(saved);
    }

    public List<AppointmentSlotResponse> getAvailableSlots(Long doctorId, LocalDate date) {
        DoctorProfile doctor = doctorProfileRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        if (doctor.getApprovalStatus() != DoctorApprovalStatus.APPROVED) {
            return List.of();
        }

        if (date.isBefore(LocalDate.now())) {
            return List.of();
        }

        int dayOfWeek = date.getDayOfWeek().getValue();
        List<DoctorAvailability> schedules = doctorAvailabilityRepository.findByDoctorIdAndActiveTrue(doctor.getId())
                .stream()
                .filter(schedule -> schedule.getDayOfWeek() == dayOfWeek)
                .sorted(Comparator.comparing(DoctorAvailability::getStartTime))
                .toList();

        if (schedules.isEmpty()) {
            return List.of();
        }

        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = dayStart.plusDays(1).minusSeconds(1);
        List<Appointment> bookedAppointments = appointmentRepository.findByDoctorIdAndStatusInAndStartTimeBetween(
                doctor.getId(),
                List.of(AppointmentStatus.PENDING, AppointmentStatus.APPROVED),
                dayStart,
                dayEnd
        );

        LocalDateTime now = LocalDateTime.now();
        Map<LocalDateTime, AppointmentSlotResponse> available = new LinkedHashMap<>();

        for (DoctorAvailability schedule : schedules) {
            LocalDateTime cursor = LocalDateTime.of(date, schedule.getStartTime());
            LocalDateTime scheduleEnd = LocalDateTime.of(date, schedule.getEndTime());

            while (!cursor.plusMinutes(SLOT_MINUTES).isAfter(scheduleEnd)) {
                LocalDateTime slotStart = cursor;
                LocalDateTime slotEnd = cursor.plusMinutes(SLOT_MINUTES);

                boolean isPastSlot = !slotStart.isAfter(now);
                boolean overlapsBooked = bookedAppointments.stream().anyMatch(existing ->
                        overlaps(slotStart, slotEnd, existing.getStartTime(), existing.getEndTime())
                );

                if (!isPastSlot && !overlapsBooked) {
                    available.putIfAbsent(slotStart, new AppointmentSlotResponse(slotStart, slotEnd));
                }

                cursor = cursor.plusMinutes(SLOT_MINUTES);
            }
        }

        return available.values().stream()
                .sorted(Comparator.comparing(AppointmentSlotResponse::startTime))
                .toList();
    }

    public List<AppointmentResponse> getPatientAppointments(Long patientUserId) {
        PatientProfile patient = patientProfileRepository.findByUserId(patientUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
        return appointmentRepository.findByPatientIdOrderByStartTimeDesc(patient.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<AppointmentResponse> getDoctorAppointments(Long doctorUserId) {
        DoctorProfile doctor = doctorProfileRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));
        return appointmentRepository.findByDoctorIdOrderByStartTimeDesc(doctor.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<AppointmentResponse> getAllAppointments() {
        return appointmentRepository.findAllByOrderByStartTimeDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AppointmentResponse updateByDoctor(Long doctorUserId, Long appointmentId, AppointmentStatusUpdateRequest request) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        DoctorProfile doctor = doctorProfileRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));

        if (!appointment.getDoctor().getId().equals(doctor.getId())) {
            throw new ForbiddenException("You cannot modify this appointment");
        }

        if (request.status() == AppointmentStatus.CANCELLED) {
            throw new BadRequestException("Doctor cannot set CANCELLED status");
        }

        appointment.setStatus(request.status());
        if (request.status() == AppointmentStatus.REJECTED) {
            appointment.setCancellationReason(request.cancellationReason());
        }

        Appointment saved = appointmentRepository.save(appointment);

        if (request.status() == AppointmentStatus.APPROVED) {
            notificationService.createNotification(
                    appointment.getPatient().getUser(),
                    "Appointment Approved",
                    "Your appointment with Dr. " + appointment.getDoctor().getUser().getFullName() + " is approved.",
                    NotificationType.APPOINTMENT_APPROVED,
                    appointment.getId()
            );
        } else if (request.status() == AppointmentStatus.REJECTED) {
            notificationService.createNotification(
                    appointment.getPatient().getUser(),
                    "Appointment Rejected",
                    "Your appointment request was rejected.",
                    NotificationType.APPOINTMENT_REJECTED,
                    appointment.getId()
            );
        }

        auditService.log(
                doctor.getUser(),
                "APPOINTMENT_STATUS_UPDATED",
                "APPOINTMENT",
                saved.getId(),
                "Status changed to " + saved.getStatus()
        );

        return toResponse(saved);
    }

    @Transactional
    public AppointmentResponse cancelByPatient(Long patientUserId, Long appointmentId, String reason) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        PatientProfile patient = patientProfileRepository.findByUserId(patientUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        if (!appointment.getPatient().getId().equals(patient.getId())) {
            throw new ForbiddenException("You cannot cancel this appointment");
        }

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Completed appointment cannot be cancelled");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancellationReason(reason);
        Appointment saved = appointmentRepository.save(appointment);

        notificationService.createNotification(
                appointment.getDoctor().getUser(),
                "Appointment Cancelled",
                "Appointment was cancelled by patient " + appointment.getPatient().getUser().getFullName(),
                NotificationType.SYSTEM,
                appointment.getId()
        );

        auditService.log(
                patient.getUser(),
                "APPOINTMENT_CANCELLED",
                "APPOINTMENT",
                saved.getId(),
                "Cancelled by patient"
        );

        return toResponse(saved);
    }

    public AppointmentResponse getAppointmentForUser(Long userId, Role role, Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        boolean allowed = switch (role) {
            case ADMIN -> true;
            case DOCTOR -> appointment.getDoctor().getUser().getId().equals(userId);
            case PATIENT -> appointment.getPatient().getUser().getId().equals(userId);
        };

        if (!allowed) {
            throw new ForbiddenException("Access denied to this appointment");
        }

        return toResponse(appointment);
    }

    private void validateSlotBoundary(LocalDateTime startTime, LocalDateTime endTime) {
        if (!startTime.toLocalDate().equals(endTime.toLocalDate())) {
            throw new BadRequestException("Appointment slot must be within the same date");
        }

        if (startTime.getMinute() % SLOT_MINUTES != 0 || endTime.getMinute() % SLOT_MINUTES != 0) {
            throw new BadRequestException("Appointments must start on 30-minute boundaries");
        }

        if (startTime.getSecond() != 0 || endTime.getSecond() != 0 || startTime.getNano() != 0 || endTime.getNano() != 0) {
            throw new BadRequestException("Appointment time format is invalid");
        }

        long durationMinutes = Duration.between(startTime, endTime).toMinutes();
        if (durationMinutes != SLOT_MINUTES) {
            throw new BadRequestException("Appointment duration must be exactly 30 minutes");
        }
    }

    private boolean overlaps(LocalDateTime aStart, LocalDateTime aEnd, LocalDateTime bStart, LocalDateTime bEnd) {
        if (aStart == null || aEnd == null || bStart == null || bEnd == null) {
            return false;
        }
        return aStart.isBefore(bEnd) && aEnd.isAfter(bStart);
    }

    private void validateAvailability(DoctorProfile doctor, LocalDateTime startTime, LocalDateTime endTime) {
        List<DoctorAvailability> schedules = doctorAvailabilityRepository.findByDoctorIdAndActiveTrue(doctor.getId());
        if (schedules.isEmpty()) {
            throw new BadRequestException("Doctor availability is not configured");
        }

        int dayOfWeek = startTime.getDayOfWeek().getValue();

        boolean withinSchedule = schedules.stream()
                .filter(schedule -> schedule.getDayOfWeek() == dayOfWeek)
                .anyMatch(schedule ->
                        !startTime.toLocalTime().isBefore(schedule.getStartTime())
                                && !endTime.toLocalTime().isAfter(schedule.getEndTime())
                );

        if (!withinSchedule) {
            throw new BadRequestException("Selected slot is outside doctor availability");
        }
    }

    public AppointmentResponse toResponse(Appointment appointment) {
        return new AppointmentResponse(
                appointment.getId(),
                appointment.getPatient().getId(),
                appointment.getPatient().getUser().getFullName(),
                appointment.getDoctor().getId(),
                appointment.getDoctor().getUser().getFullName(),
                appointment.getDoctor().getSpecialization(),
                appointment.getStartTime(),
                appointment.getEndTime(),
                appointment.getReason(),
                appointment.getStatus(),
                appointment.getMeetingRoomId(),
                appointment.getCancellationReason()
        );
    }
}


