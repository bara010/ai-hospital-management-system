package com.hospito.controller;

import com.hospito.dto.*;
import com.hospito.exception.UnauthorizedException;
import com.hospito.security.AuthUser;
import com.hospito.security.SecurityUtils;
import com.hospito.service.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients/me")
@PreAuthorize("hasRole('PATIENT')")
public class PatientController {

    private final AppointmentService appointmentService;
    private final MedicalService medicalService;
    private final RatingService ratingService;
    private final MedicationService medicationService;
    private final LabOrderService labOrderService;
    private final BillingService billingService;
    private final PatientService patientService;

    public PatientController(
            AppointmentService appointmentService,
            MedicalService medicalService,
            RatingService ratingService,
            MedicationService medicationService,
            LabOrderService labOrderService,
            BillingService billingService,
            PatientService patientService
    ) {
        this.appointmentService = appointmentService;
        this.medicalService = medicalService;
        this.ratingService = ratingService;
        this.medicationService = medicationService;
        this.labOrderService = labOrderService;
        this.billingService = billingService;
        this.patientService = patientService;
    }

    @PostMapping("/appointments")
    public ResponseEntity<AppointmentResponse> bookAppointment(@Valid @RequestBody AppointmentBookRequest request) {
        AuthUser user = currentUser();
        return ResponseEntity.ok(appointmentService.bookAppointment(user.getId(), request));
    }

    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentResponse>> myAppointments() {
        AuthUser user = currentUser();
        return ResponseEntity.ok(appointmentService.getPatientAppointments(user.getId()));
    }

    @PatchMapping("/appointments/{appointmentId}/cancel")
    public ResponseEntity<AppointmentResponse> cancel(
            @PathVariable Long appointmentId,
            @RequestParam(required = false) String reason
    ) {
        AuthUser user = currentUser();
        return ResponseEntity.ok(appointmentService.cancelByPatient(user.getId(), appointmentId, reason));
    }

    @GetMapping("/medical-records")
    public ResponseEntity<List<MedicalRecordResponse>> records() {
        AuthUser user = currentUser();
        return ResponseEntity.ok(medicalService.getPatientRecords(user.getId()));
    }

    @GetMapping("/prescriptions")
    public ResponseEntity<List<PrescriptionResponse>> prescriptions() {
        AuthUser user = currentUser();
        return ResponseEntity.ok(medicalService.getPatientPrescriptions(user.getId()));
    }

    @PostMapping("/ratings")
    public ResponseEntity<DoctorRatingResponse> submitRating(@Valid @RequestBody DoctorRatingRequest request) {
        AuthUser user = currentUser();
        return ResponseEntity.ok(ratingService.submitRating(user.getId(), request));
    }

    @GetMapping("/medications")
    public ResponseEntity<List<MedicationPlanResponse>> medications() {
        AuthUser user = currentUser();
        return ResponseEntity.ok(medicationService.getPatientPlans(user.getId()));
    }

    @PostMapping("/medications/{medicationPlanId}/take")
    public ResponseEntity<MedicationPlanResponse> markMedicationTaken(@PathVariable Long medicationPlanId) {
        AuthUser user = currentUser();
        return ResponseEntity.ok(medicationService.markTaken(user.getId(), medicationPlanId));
    }

    @GetMapping("/lab-orders")
    public ResponseEntity<List<LabOrderResponse>> labOrders() {
        AuthUser user = currentUser();
        return ResponseEntity.ok(labOrderService.getPatientOrders(user.getId()));
    }

    @GetMapping("/billing")
    public ResponseEntity<List<BillingResponse>> bills() {
        AuthUser user = currentUser();
        return ResponseEntity.ok(billingService.getPatientBills(user.getId()));
    }

    @PostMapping("/billing/{billingId}/pay")
    public ResponseEntity<BillingResponse> payBill(
            @PathVariable Long billingId,
            @RequestBody(required = false) BillingPaymentRequest request
    ) {
        AuthUser user = currentUser();
        return ResponseEntity.ok(billingService.payBill(user.getId(), billingId, request));
    }

    @GetMapping("/emergency-summary")
    public ResponseEntity<EmergencySummaryResponse> emergencySummary() {
        AuthUser user = currentUser();
        return ResponseEntity.ok(patientService.emergencySummary(user.getId()));
    }

    private AuthUser currentUser() {
        AuthUser user = SecurityUtils.currentUser();
        if (user == null) {
            throw new UnauthorizedException("Authentication required");
        }
        return user;
    }
}
