package com.hospito.service;

import com.hospito.dto.MedicationPlanCreateRequest;
import com.hospito.dto.MedicationPlanResponse;
import com.hospito.entity.*;
import com.hospito.exception.BadRequestException;
import com.hospito.exception.ForbiddenException;
import com.hospito.exception.ResourceNotFoundException;
import com.hospito.repository.AppointmentRepository;
import com.hospito.repository.DoctorProfileRepository;
import com.hospito.repository.MedicationPlanRepository;
import com.hospito.repository.PatientProfileRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class MedicationService {

    private final MedicationPlanRepository medicationPlanRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final AppointmentRepository appointmentRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    public MedicationService(
            MedicationPlanRepository medicationPlanRepository,
            DoctorProfileRepository doctorProfileRepository,
            PatientProfileRepository patientProfileRepository,
            AppointmentRepository appointmentRepository,
            NotificationService notificationService,
            AuditService auditService
    ) {
        this.medicationPlanRepository = medicationPlanRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.appointmentRepository = appointmentRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @Transactional
    public MedicationPlanResponse createPlan(Long doctorUserId, MedicationPlanCreateRequest request) {
        DoctorProfile doctor = doctorProfileRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));

        PatientProfile patient = patientProfileRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        if (request.endDate().isBefore(request.startDate())) {
            throw new BadRequestException("Medication end date must be on or after start date");
        }

        Appointment appointment = null;
        if (request.appointmentId() != null) {
            appointment = appointmentRepository.findById(request.appointmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

            if (!appointment.getDoctor().getId().equals(doctor.getId())) {
                throw new ForbiddenException("Appointment does not belong to this doctor");
            }
            if (!appointment.getPatient().getId().equals(patient.getId())) {
                throw new BadRequestException("Patient does not match appointment");
            }
        }

        int totalDays = Math.toIntExact(ChronoUnit.DAYS.between(request.startDate(), request.endDate()) + 1);
        int totalDoses = Math.max(1, totalDays * request.frequencyPerDay());

        MedicationPlan plan = new MedicationPlan();
        plan.setDoctor(doctor);
        plan.setPatient(patient);
        plan.setAppointment(appointment);
        plan.setMedication(request.medication().trim());
        plan.setDosage(request.dosage().trim());
        plan.setInstructions(request.instructions());
        plan.setFrequencyPerDay(request.frequencyPerDay());
        plan.setStartDate(request.startDate());
        plan.setEndDate(request.endDate());
        plan.setTotalDoses(totalDoses);
        plan.setDosesTaken(0);
        plan.setActive(true);

        MedicationPlan saved = medicationPlanRepository.save(plan);

        notificationService.createNotification(
                patient.getUser(),
                "Medication Plan Added",
                "Dr. " + doctor.getUser().getFullName() + " added a medication plan for you.",
                NotificationType.DOCTOR_MESSAGE,
                saved.getId()
        );

        notificationService.createNotification(
                patient.getUser(),
                "Medication Reminder Activated",
                "AI reminders are active for " + saved.getMedication() + " from " + saved.getStartDate() + " to " + saved.getEndDate() + ".",
                NotificationType.MEDICATION_REMINDER,
                saved.getId()
        );

        auditService.log(
                doctor.getUser(),
                "MEDICATION_PLAN_CREATED",
                "MEDICATION_PLAN",
                saved.getId(),
                "Created medication plan for patientId=" + patient.getId()
        );

        return toResponse(saved);
    }

    public List<MedicationPlanResponse> getDoctorPlans(Long doctorUserId) {
        DoctorProfile doctor = doctorProfileRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));

        return medicationPlanRepository.findByDoctorIdOrderByCreatedAtDesc(doctor.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<MedicationPlanResponse> getPatientPlans(Long patientUserId) {
        PatientProfile patient = patientProfileRepository.findByUserId(patientUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        return medicationPlanRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public MedicationPlanResponse updateActiveStatus(Long doctorUserId, Long medicationPlanId, boolean active) {
        DoctorProfile doctor = doctorProfileRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));

        MedicationPlan plan = medicationPlanRepository.findById(medicationPlanId)
                .orElseThrow(() -> new ResourceNotFoundException("Medication plan not found"));

        if (!plan.getDoctor().getId().equals(doctor.getId())) {
            throw new ForbiddenException("Medication plan does not belong to this doctor");
        }

        plan.setActive(active);
        MedicationPlan saved = medicationPlanRepository.save(plan);

        auditService.log(
                doctor.getUser(),
                "MEDICATION_PLAN_STATUS_UPDATED",
                "MEDICATION_PLAN",
                saved.getId(),
                "Set active=" + active
        );

        return toResponse(saved);
    }

    @Transactional
    public MedicationPlanResponse markTaken(Long patientUserId, Long medicationPlanId) {
        PatientProfile patient = patientProfileRepository.findByUserId(patientUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        MedicationPlan plan = medicationPlanRepository.findById(medicationPlanId)
                .orElseThrow(() -> new ResourceNotFoundException("Medication plan not found"));

        if (!plan.getPatient().getId().equals(patient.getId())) {
            throw new ForbiddenException("Medication plan does not belong to this patient");
        }

        if (!plan.isActive()) {
            throw new BadRequestException("Medication plan is inactive");
        }

        LocalDate today = LocalDate.now();
        if (today.isBefore(plan.getStartDate()) || today.isAfter(plan.getEndDate())) {
            throw new BadRequestException("Medication is outside schedule window");
        }

        int nextTaken = Math.min(plan.getTotalDoses(), plan.getDosesTaken() + 1);
        plan.setDosesTaken(nextTaken);
        plan.setLastTakenAt(LocalDateTime.now());

        if (nextTaken >= plan.getTotalDoses()) {
            plan.setActive(false);
        }

        MedicationPlan saved = medicationPlanRepository.save(plan);

        auditService.log(
                patient.getUser(),
                "MEDICATION_DOSE_TAKEN",
                "MEDICATION_PLAN",
                saved.getId(),
                "Dose marked as taken"
        );

        return toResponse(saved);
    }

    private MedicationPlanResponse toResponse(MedicationPlan plan) {
        double adherence = plan.getTotalDoses() == null || plan.getTotalDoses() == 0
                ? 0D
                : ((double) plan.getDosesTaken() / (double) plan.getTotalDoses()) * 100D;

        return new MedicationPlanResponse(
                plan.getId(),
                plan.getPatient().getId(),
                plan.getPatient().getUser().getFullName(),
                plan.getDoctor().getId(),
                plan.getDoctor().getUser().getFullName(),
                plan.getAppointment() == null ? null : plan.getAppointment().getId(),
                plan.getMedication(),
                plan.getDosage(),
                plan.getInstructions(),
                plan.getFrequencyPerDay(),
                plan.getStartDate(),
                plan.getEndDate(),
                plan.getTotalDoses(),
                plan.getDosesTaken(),
                Math.round(adherence * 100.0) / 100.0,
                plan.isActive(),
                plan.getLastTakenAt()
        );
    }
}


