package com.hospito.service;

import com.hospito.dto.*;
import com.hospito.entity.*;
import com.hospito.exception.BadRequestException;
import com.hospito.exception.ForbiddenException;
import com.hospito.exception.ResourceNotFoundException;
import com.hospito.repository.AppointmentRepository;
import com.hospito.repository.BillingRecordRepository;
import com.hospito.repository.PatientProfileRepository;
import com.hospito.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;

@Service
public class BillingService {

    private final BillingRecordRepository billingRecordRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    public BillingService(
            BillingRecordRepository billingRecordRepository,
            PatientProfileRepository patientProfileRepository,
            AppointmentRepository appointmentRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            AuditService auditService
    ) {
        this.billingRecordRepository = billingRecordRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @Transactional
    public BillingResponse createBill(Long adminUserId, BillingCreateRequest request) {
        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found"));

        PatientProfile patient = patientProfileRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        Appointment appointment = null;
        if (request.appointmentId() != null) {
            appointment = appointmentRepository.findById(request.appointmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
            if (!appointment.getPatient().getId().equals(patient.getId())) {
                throw new BadRequestException("Patient does not match appointment");
            }
        }

        BigDecimal amount = normalizeMoney(request.amount());
        BigDecimal insuranceCoverage = normalizeMoney(request.insuranceCoverageAmount());
        if (insuranceCoverage.compareTo(amount) > 0) {
            insuranceCoverage = amount;
        }

        BigDecimal payable = amount.subtract(insuranceCoverage);

        BillingRecord record = new BillingRecord();
        record.setPatient(patient);
        record.setAppointment(appointment);
        record.setAmount(amount);
        record.setCurrency(normalizeCurrency(request.currency()));
        record.setDescription(request.description());
        record.setInsuranceProvider(request.insuranceProvider());
        record.setInsurancePolicyNumber(request.insurancePolicyNumber());
        record.setInsuranceCoverageAmount(insuranceCoverage);
        record.setPatientPayableAmount(payable);
        record.setAmountPaid(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        record.setStatus(BillingStatus.UNPAID);

        BillingRecord saved = billingRecordRepository.save(record);

        notificationService.createNotification(
                patient.getUser(),
                "New Bill Generated",
                "A new bill of " + saved.getAmount() + " " + saved.getCurrency() + " was added to your account.",
                NotificationType.BILLING,
                saved.getId()
        );

        auditService.log(
                admin,
                "BILL_CREATED",
                "BILLING_RECORD",
                saved.getId(),
                "Created bill for patientId=" + patient.getId()
        );

        return toResponse(saved);
    }

    public List<BillingResponse> getAllBills() {
        return billingRecordRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<BillingResponse> getPatientBills(Long patientUserId) {
        PatientProfile patient = patientProfileRepository.findByUserId(patientUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        return billingRecordRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public BillingResponse payBill(Long patientUserId, Long billingId, BillingPaymentRequest request) {
        PatientProfile patient = patientProfileRepository.findByUserId(patientUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        BillingRecord record = billingRecordRepository.findById(billingId)
                .orElseThrow(() -> new ResourceNotFoundException("Billing record not found"));

        if (!record.getPatient().getId().equals(patient.getId())) {
            throw new ForbiddenException("Billing record does not belong to this patient");
        }

        if (record.getStatus() == BillingStatus.CANCELLED) {
            throw new BadRequestException("Cancelled bill cannot be paid");
        }

        BigDecimal remaining = record.getPatientPayableAmount().subtract(record.getAmountPaid());
        if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Bill is already fully paid");
        }

        BigDecimal paymentAmount = request == null ? null : request.amount();
        paymentAmount = paymentAmount == null ? remaining : normalizeMoney(paymentAmount);

        if (paymentAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Payment amount must be greater than zero");
        }

        if (paymentAmount.compareTo(remaining) > 0) {
            throw new BadRequestException("Payment amount exceeds remaining payable amount");
        }

        BigDecimal updatedPaid = record.getAmountPaid().add(paymentAmount);
        record.setAmountPaid(updatedPaid);

        if (updatedPaid.compareTo(record.getPatientPayableAmount()) >= 0) {
            record.setStatus(BillingStatus.PAID);
            record.setPaidAt(Instant.now());
        } else {
            record.setStatus(BillingStatus.PARTIALLY_PAID);
        }

        BillingRecord saved = billingRecordRepository.save(record);

        auditService.log(
                patient.getUser(),
                "BILL_PAID",
                "BILLING_RECORD",
                saved.getId(),
                "Paid amount=" + paymentAmount
        );

        return toResponse(saved);
    }

    @Transactional
    public BillingResponse updateBillStatus(Long adminUserId, Long billingId, BillingStatusUpdateRequest request) {
        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found"));

        BillingRecord record = billingRecordRepository.findById(billingId)
                .orElseThrow(() -> new ResourceNotFoundException("Billing record not found"));

        if (request.amountPaid() != null) {
            BigDecimal normalizedPaid = normalizeMoney(request.amountPaid());
            BigDecimal capped = normalizedPaid.min(record.getPatientPayableAmount()).max(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
            record.setAmountPaid(capped);
        }

        record.setStatus(request.status());

        if (request.status() == BillingStatus.PAID) {
            record.setAmountPaid(record.getPatientPayableAmount());
            record.setPaidAt(Instant.now());
        } else if (request.status() == BillingStatus.UNPAID) {
            record.setAmountPaid(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
            record.setPaidAt(null);
        } else if (request.status() == BillingStatus.PARTIALLY_PAID) {
            if (record.getAmountPaid().compareTo(BigDecimal.ZERO) <= 0
                    || record.getAmountPaid().compareTo(record.getPatientPayableAmount()) >= 0) {
                throw new BadRequestException("Partial payment status requires paid amount between 0 and payable amount");
            }
            record.setPaidAt(null);
        }

        BillingRecord saved = billingRecordRepository.save(record);

        notificationService.createNotification(
                saved.getPatient().getUser(),
                "Billing Status Updated",
                "Your bill status is now " + saved.getStatus(),
                NotificationType.BILLING,
                saved.getId()
        );

        auditService.log(
                admin,
                "BILL_STATUS_UPDATED",
                "BILLING_RECORD",
                saved.getId(),
                "Status=" + saved.getStatus() + (request.note() == null ? "" : (", note=" + request.note()))
        );

        return toResponse(saved);
    }

    private BillingResponse toResponse(BillingRecord record) {
        return new BillingResponse(
                record.getId(),
                record.getPatient().getId(),
                record.getPatient().getUser().getFullName(),
                record.getAppointment() == null ? null : record.getAppointment().getId(),
                record.getAmount(),
                record.getCurrency(),
                record.getInsuranceProvider(),
                record.getInsurancePolicyNumber(),
                record.getInsuranceCoverageAmount(),
                record.getPatientPayableAmount(),
                record.getAmountPaid(),
                record.getStatus(),
                record.getDescription(),
                record.getCreatedAt(),
                record.getPaidAt()
        );
    }

    private String normalizeCurrency(String currency) {
        if (currency == null || currency.isBlank()) {
            return "INR";
        }
        return currency.trim().toUpperCase();
    }

    private BigDecimal normalizeMoney(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
