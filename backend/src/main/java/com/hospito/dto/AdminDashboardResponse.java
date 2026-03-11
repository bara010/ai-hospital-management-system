package com.hospito.dto;

public record AdminDashboardResponse(
        long totalPatients,
        long totalDoctors,
        long totalAppointments,
        long pendingDoctorApprovals
) {
}
