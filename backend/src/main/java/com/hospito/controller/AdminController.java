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
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final DoctorService doctorService;
    private final PatientService patientService;
    private final AppointmentService appointmentService;
    private final LabOrderService labOrderService;
    private final BillingService billingService;
    private final AuditService auditService;

    public AdminController(
            AdminService adminService,
            DoctorService doctorService,
            PatientService patientService,
            AppointmentService appointmentService,
            LabOrderService labOrderService,
            BillingService billingService,
            AuditService auditService
    ) {
        this.adminService = adminService;
        this.doctorService = doctorService;
        this.patientService = patientService;
        this.appointmentService = appointmentService;
        this.labOrderService = labOrderService;
        this.billingService = billingService;
        this.auditService = auditService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardResponse> dashboard() {
        return ResponseEntity.ok(adminService.dashboard());
    }

    @GetMapping("/doctors")
    public ResponseEntity<List<AdminDoctorResponse>> doctors() {
        return ResponseEntity.ok(doctorService.listAllDoctorsForAdmin());
    }

    @PatchMapping("/doctors/{doctorId}/approval")
    public ResponseEntity<AdminDoctorResponse> updateApproval(
            @PathVariable Long doctorId,
            @Valid @RequestBody DoctorApprovalUpdateRequest request
    ) {
        return ResponseEntity.ok(doctorService.updateApproval(doctorId, request));
    }

    @GetMapping("/patients")
    public ResponseEntity<List<PatientSummaryResponse>> patients() {
        return ResponseEntity.ok(patientService.listPatientsForAdmin());
    }

    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentResponse>> appointments() {
        return ResponseEntity.ok(appointmentService.getAllAppointments());
    }

    @GetMapping("/lab-orders")
    public ResponseEntity<List<LabOrderResponse>> labOrders() {
        return ResponseEntity.ok(labOrderService.getAllOrders());
    }

    @PostMapping("/billing")
    public ResponseEntity<BillingResponse> createBill(@Valid @RequestBody BillingCreateRequest request) {
        AuthUser user = currentUser();
        return ResponseEntity.ok(billingService.createBill(user.getId(), request));
    }

    @GetMapping("/billing")
    public ResponseEntity<List<BillingResponse>> bills() {
        return ResponseEntity.ok(billingService.getAllBills());
    }

    @PatchMapping("/billing/{billingId}/status")
    public ResponseEntity<BillingResponse> updateBillStatus(
            @PathVariable Long billingId,
            @Valid @RequestBody BillingStatusUpdateRequest request
    ) {
        AuthUser user = currentUser();
        return ResponseEntity.ok(billingService.updateBillStatus(user.getId(), billingId, request));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLogResponse>> auditLogs(@RequestParam(defaultValue = "200") int limit) {
        return ResponseEntity.ok(auditService.recent(limit));
    }

    private AuthUser currentUser() {
        AuthUser user = SecurityUtils.currentUser();
        if (user == null) {
            throw new UnauthorizedException("Authentication required");
        }
        return user;
    }
}
