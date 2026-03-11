package com.hospito.service;

import com.hospito.dto.LabOrderCreateRequest;
import com.hospito.dto.LabOrderResponse;
import com.hospito.dto.LabOrderResultUpdateRequest;
import com.hospito.dto.LabOrderStatusUpdateRequest;
import com.hospito.entity.*;
import com.hospito.exception.BadRequestException;
import com.hospito.exception.ForbiddenException;
import com.hospito.exception.ResourceNotFoundException;
import com.hospito.repository.AppointmentRepository;
import com.hospito.repository.DoctorProfileRepository;
import com.hospito.repository.LabOrderRepository;
import com.hospito.repository.PatientProfileRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class LabOrderService {

    private final LabOrderRepository labOrderRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final AppointmentRepository appointmentRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    public LabOrderService(
            LabOrderRepository labOrderRepository,
            DoctorProfileRepository doctorProfileRepository,
            PatientProfileRepository patientProfileRepository,
            AppointmentRepository appointmentRepository,
            NotificationService notificationService,
            AuditService auditService
    ) {
        this.labOrderRepository = labOrderRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.appointmentRepository = appointmentRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @Transactional
    public LabOrderResponse createOrder(Long doctorUserId, LabOrderCreateRequest request) {
        DoctorProfile doctor = doctorProfileRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));

        PatientProfile patient = patientProfileRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

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

        LabOrder order = new LabOrder();
        order.setDoctor(doctor);
        order.setPatient(patient);
        order.setAppointment(appointment);
        order.setTestName(request.testName().trim());
        order.setInstructions(request.instructions());
        order.setStatus(LabOrderStatus.ORDERED);

        LabOrder saved = labOrderRepository.save(order);

        notificationService.createNotification(
                patient.getUser(),
                "Lab Test Ordered",
                "Dr. " + doctor.getUser().getFullName() + " ordered a lab test: " + saved.getTestName(),
                NotificationType.LAB_ORDER,
                saved.getId()
        );

        auditService.log(
                doctor.getUser(),
                "LAB_ORDER_CREATED",
                "LAB_ORDER",
                saved.getId(),
                "Created lab order for patientId=" + patient.getId()
        );

        return toResponse(saved);
    }

    public List<LabOrderResponse> getDoctorOrders(Long doctorUserId) {
        DoctorProfile doctor = doctorProfileRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));

        return labOrderRepository.findByDoctorIdOrderByCreatedAtDesc(doctor.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<LabOrderResponse> getPatientOrders(Long patientUserId) {
        PatientProfile patient = patientProfileRepository.findByUserId(patientUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        return labOrderRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<LabOrderResponse> getAllOrders() {
        return labOrderRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public LabOrderResponse updateStatus(Long doctorUserId, Long labOrderId, LabOrderStatusUpdateRequest request) {
        DoctorProfile doctor = doctorProfileRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));

        LabOrder order = labOrderRepository.findById(labOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Lab order not found"));

        if (!order.getDoctor().getId().equals(doctor.getId())) {
            throw new ForbiddenException("Lab order does not belong to this doctor");
        }

        order.setStatus(request.status());
        order.setStatusNote(request.statusNote());

        if (request.status() == LabOrderStatus.RESULT_READY) {
            order.setResultAt(Instant.now());
        }

        LabOrder saved = labOrderRepository.save(order);

        notificationService.createNotification(
                saved.getPatient().getUser(),
                "Lab Order Updated",
                "Lab order status changed to " + saved.getStatus(),
                NotificationType.LAB_ORDER,
                saved.getId()
        );

        auditService.log(
                doctor.getUser(),
                "LAB_ORDER_STATUS_UPDATED",
                "LAB_ORDER",
                saved.getId(),
                "Status changed to " + saved.getStatus()
        );

        return toResponse(saved);
    }

    @Transactional
    public LabOrderResponse updateResult(Long doctorUserId, Long labOrderId, LabOrderResultUpdateRequest request) {
        DoctorProfile doctor = doctorProfileRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));

        LabOrder order = labOrderRepository.findById(labOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Lab order not found"));

        if (!order.getDoctor().getId().equals(doctor.getId())) {
            throw new ForbiddenException("Lab order does not belong to this doctor");
        }

        order.setResultSummary(request.resultSummary());
        order.setResultFilePath(request.resultFilePath());
        order.setStatus(LabOrderStatus.RESULT_READY);
        order.setResultAt(Instant.now());

        LabOrder saved = labOrderRepository.save(order);

        notificationService.createNotification(
                saved.getPatient().getUser(),
                "Lab Result Ready",
                "Result is ready for: " + saved.getTestName(),
                NotificationType.LAB_ORDER,
                saved.getId()
        );

        auditService.log(
                doctor.getUser(),
                "LAB_ORDER_RESULT_UPDATED",
                "LAB_ORDER",
                saved.getId(),
                "Result updated"
        );

        return toResponse(saved);
    }

    private LabOrderResponse toResponse(LabOrder order) {
        return new LabOrderResponse(
                order.getId(),
                order.getPatient().getId(),
                order.getPatient().getUser().getFullName(),
                order.getDoctor().getId(),
                order.getDoctor().getUser().getFullName(),
                order.getAppointment() == null ? null : order.getAppointment().getId(),
                order.getTestName(),
                order.getInstructions(),
                order.getStatus(),
                order.getStatusNote(),
                order.getResultSummary(),
                order.getResultFilePath() == null ? null : "/uploads/" + order.getResultFilePath(),
                order.getCreatedAt(),
                order.getResultAt()
        );
    }
}
