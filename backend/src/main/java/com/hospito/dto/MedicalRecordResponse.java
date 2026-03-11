package com.hospito.dto;

import java.time.LocalDate;

public record MedicalRecordResponse(
        Long id,
        Long patientId,
        String patientName,
        Long doctorId,
        String doctorName,
        Long appointmentId,
        LocalDate recordDate,
        String diagnosis,
        String notes,
        String reportPath
) {
}
