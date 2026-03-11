package com.hospital.controller;

import com.hospital.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * AnalyticsController — aggregated stats for the dashboard analytics page.
 *
 * GET /api/analytics/summary   — full system-wide summary
 * GET /api/analytics/dashboard — compact dashboard stats
 */
@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    @Autowired private NotificationRepository notificationRepo;
    @Autowired private PatientRepository patientRepo;
    @Autowired private AppointmentRepository appointmentRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private VitalRecordRepository vitalRepo;
    @Autowired private MoodLogRepository moodRepo;
    @Autowired private InvoiceRepository invoiceRepo;
    @Autowired private PharmacyItemRepository pharmacyRepo;
    @Autowired private BedRecordRepository bedRepo;
    @Autowired private AuditLogRepository auditRepo;

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        Map<String, Object> stats = new LinkedHashMap<>();

        // Notifications
        long totalNotifs  = notificationRepo.count();
        long unreadNotifs = notificationRepo.countByReadFalse();
        double readRate = totalNotifs > 0 ? ((double)(totalNotifs - unreadNotifs) / totalNotifs) * 100 : 0;
        stats.put("totalNotifications", totalNotifs);
        stats.put("unreadNotifications", unreadNotifs);
        stats.put("readRate", Math.round(readRate));

        // Users & Patients
        stats.put("totalPatients", patientRepo.count());
        stats.put("totalUsers", userRepo.count());
        stats.put("admittedPatients", patientRepo.findByStatus("ADMITTED").size());

        // Appointments
        long scheduled  = appointmentRepo.findByStatus("SCHEDULED").size();
        long completed  = appointmentRepo.findByStatus("COMPLETED").size();
        long cancelled  = appointmentRepo.findByStatus("CANCELLED").size();
        long noShow     = appointmentRepo.findByStatus("NO_SHOW").size();
        long totalAppts = appointmentRepo.count();
        stats.put("scheduledAppointments", scheduled);
        stats.put("completedAppointments", completed);
        stats.put("cancelledAppointments", cancelled);
        stats.put("noShowAppointments", noShow);
        stats.put("totalAppointments", totalAppts);

        // Vitals
        stats.put("vitalRecords", vitalRepo.count());

        // Mood
        stats.put("moodLogs", moodRepo.count());

        // Billing
        Double paidAmount = invoiceRepo.sumPaidInvoices();
        Double pendingAmount = invoiceRepo.sumPendingInvoices();
        Double overdueAmount = invoiceRepo.sumOverdueInvoices();
        double totalRevenue = (paidAmount != null ? paidAmount : 0)
            + (pendingAmount != null ? pendingAmount : 0)
            + (overdueAmount != null ? overdueAmount : 0);
        stats.put("totalInvoices", invoiceRepo.count());
        stats.put("totalRevenue", totalRevenue);
        stats.put("paidRevenue", paidAmount != null ? paidAmount : 0);
        stats.put("pendingRevenue", pendingAmount != null ? pendingAmount : 0);
        stats.put("overdueRevenue", overdueAmount != null ? overdueAmount : 0);
        stats.put("collectionRate", totalRevenue > 0 ? Math.round((paidAmount != null ? paidAmount : 0) / totalRevenue * 100) : 0);

        // Pharmacy
        long totalItems = pharmacyRepo.count();
        long lowStock = pharmacyRepo.findByStockStatus("LOW").size();
        long criticalStock = pharmacyRepo.findByStockStatus("CRITICAL").size();
        stats.put("pharmacyItems", totalItems);
        stats.put("lowStockAlerts", lowStock + criticalStock);

        // Beds
        long totalBeds = bedRepo.count();
        long occupiedBeds = bedRepo.countByStatus("OCCUPIED");
        stats.put("totalBeds", totalBeds);
        stats.put("occupiedBeds", occupiedBeds);
        stats.put("occupancyRate", totalBeds > 0 ? Math.round((double) occupiedBeds / totalBeds * 100) : 0);

        // Audit
        stats.put("auditEvents", auditRepo.count());

        // Notification type breakdown
        Map<String, Long> typeBreakdown = new LinkedHashMap<>();
        List<String> types = List.of("MEDICINE_REMINDER","MOOD_CHECK","MOOD_ALERT","APPOINTMENT_REMINDER","HEALTH_TIP","LAB_ALERT","READMISSION","NOSHOW","STOCK");
        for (String type : types) {
            long count = notificationRepo.findAllByOrderByCreatedAtDesc().stream()
                .filter(n -> type.equals(n.getType())).count();
            if (count > 0) typeBreakdown.put(type, count);
        }
        stats.put("notificationTypes", typeBreakdown);

        return stats;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        Map<String, Object> d = new LinkedHashMap<>();
        d.put("totalPatients", patientRepo.count());
        d.put("scheduledAppointments", appointmentRepo.findByStatus("SCHEDULED").size());
        d.put("unreadNotifications", notificationRepo.countByReadFalse());
        d.put("lowStockAlerts", pharmacyRepo.findByStockStatus("LOW").size() + pharmacyRepo.findByStockStatus("CRITICAL").size());
        d.put("occupiedBeds", bedRepo.countByStatus("OCCUPIED"));
        d.put("totalBeds", bedRepo.count());
        Double paid = invoiceRepo.sumPaidInvoices();
        d.put("collectedToday", paid != null ? paid : 0);
        return d;
    }
}
