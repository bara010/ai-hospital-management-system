package com.hospito.dto;

import com.hospito.entity.LabOrderStatus;

import java.time.Instant;

public record LabOrderResponse(
        Long id,
        Long patientId,
        String patientName,
        Long doctorId,
        String doctorName,
        Long appointmentId,
        String testName,
        String instructions,
        LabOrderStatus status,
        String statusNote,
        String resultSummary,
        String resultFilePath,
        Instant orderedAt,
        Instant resultAt
) {
}
