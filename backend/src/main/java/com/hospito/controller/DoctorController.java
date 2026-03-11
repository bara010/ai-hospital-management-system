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
@RequestMapping("/api/doctors/me")
@PreAuthorize("hasRole('DOCTOR')")
public class DoctorController {

    private final AppointmentService appointmentService;
    private final DoctorService doctorService;
    private final MedicalService medicalService;
    private final MedicationService medicationService;
    private final LabOrderService labOrderService;

    public DoctorController(
            AppointmentService appointmentService,
            DoctorService doctorService,
            MedicalService medicalService,
            MedicationService medicationService,
            LabOrderService labOrderService
    ) {
        this.appointmentService = appointmentService;
        this.doctorService = doctorService;
        this.medicalService = medicalService;
        this.medicationService = medicationService;
        this.labOrderService = labOrderService;
    }

    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentResponse>> appointments() {
        AuthUser user = currentUser();
        return ResponseEntity.ok(appointmentService.getDoctorAppointments(user.getId()));
    }

    @PutMapping("/appointments/{appointmentId}/status")
    public ResponseEntity<AppointmentResponse> updateStatus(
            @PathVariable Long appointmentId,
            @Valid @RequestBody AppointmentStatusUpdateRequest request
    ) {
        AuthUser user = currentUser();
        return ResponseEntity.ok(appointmentService.updateByDoctor(user.getId(), appointmentId, request));
    }

    @GetMapping("/availability")
    public ResponseEntity<List<DoctorAvailabilityResponse>> availability() {
        AuthUser user = currentUser();
        Long doctorId = doctorService.getDoctorProfileByUserId(user.getId()).getId();
        return ResponseEntity.ok(doctorService.getAvailability(doctorId));
    }

    @PutMapping("/availability")
    public ResponseEntity<List<DoctorAvailabilityResponse>> updateAvailability(
            @RequestBody List<@Valid DoctorAvailabilityRequest> requests
    ) {
        AuthUser user = currentUser();
        return ResponseEntity.ok(doctorService.updateAvailability(user.getId(), requests));
    }

    @PostMapping("/medical-records")
    public ResponseEntity<MedicalRecordResponse> addMedicalRecord(@Valid @RequestBody MedicalRecordCreateRequest request) {
        AuthUser user = currentUser();
        return ResponseEntity.ok(medicalService.createRecord(user.getId(), request));
    }

    @GetMapping("/medical-records")
    public ResponseEntity<List<MedicalRecordResponse>> myMedicalRecords() {
        AuthUser user = currentUser();
        return ResponseEntity.ok(medicalService.getDoctorRecords(user.getId()));
    }

    @PostMapping("/prescriptions")
    public ResponseEntity<PrescriptionResponse> createPrescription(@Valid @RequestBody PrescriptionCreateRequest request) {
        AuthUser user = currentUser();
        return ResponseEntity.ok(medicalService.createPrescription(user.getId(), request));
    }

    @GetMapping("/prescriptions")
    public ResponseEntity<List<PrescriptionResponse>> myPrescriptions() {
        AuthUser user = currentUser();
        return ResponseEntity.ok(medicalService.getDoctorPrescriptions(user.getId()));
    }

    @PostMapping("/medications")
    public ResponseEntity<MedicationPlanResponse> createMedicationPlan(@Valid @RequestBody MedicationPlanCreateRequest request) {
        AuthUser user = currentUser();
        return ResponseEntity.ok(medicationService.createPlan(user.getId(), request));
    }

    @GetMapping("/medications")
    public ResponseEntity<List<MedicationPlanResponse>> medications() {
        AuthUser user = currentUser();
        return ResponseEntity.ok(medicationService.getDoctorPlans(user.getId()));
    }

    @PatchMapping("/medications/{medicationPlanId}/status")
    public ResponseEntity<MedicationPlanResponse> updateMedicationStatus(
            @PathVariable Long medicationPlanId,
            @Valid @RequestBody MedicationPlanStatusUpdateRequest request
    ) {
        AuthUser user = currentUser();
        return ResponseEntity.ok(medicationService.updateActiveStatus(user.getId(), medicationPlanId, request.active()));
    }

    @PostMapping("/lab-orders")
    public ResponseEntity<LabOrderResponse> createLabOrder(@Valid @RequestBody LabOrderCreateRequest request) {
        AuthUser user = currentUser();
        return ResponseEntity.ok(labOrderService.createOrder(user.getId(), request));
    }

    @GetMapping("/lab-orders")
    public ResponseEntity<List<LabOrderResponse>> labOrders() {
        AuthUser user = currentUser();
        return ResponseEntity.ok(labOrderService.getDoctorOrders(user.getId()));
    }

    @PatchMapping("/lab-orders/{labOrderId}/status")
    public ResponseEntity<LabOrderResponse> updateLabOrderStatus(
            @PathVariable Long labOrderId,
            @Valid @RequestBody LabOrderStatusUpdateRequest request
    ) {
        AuthUser user = currentUser();
        return ResponseEntity.ok(labOrderService.updateStatus(user.getId(), labOrderId, request));
    }

    @PutMapping("/lab-orders/{labOrderId}/result")
    public ResponseEntity<LabOrderResponse> updateLabOrderResult(
            @PathVariable Long labOrderId,
            @Valid @RequestBody LabOrderResultUpdateRequest request
    ) {
        AuthUser user = currentUser();
        return ResponseEntity.ok(labOrderService.updateResult(user.getId(), labOrderId, request));
    }

    private AuthUser currentUser() {
        AuthUser user = SecurityUtils.currentUser();
        if (user == null) {
            throw new UnauthorizedException("Authentication required");
        }
        return user;
    }
}
