package com.hospito.dto;

import java.time.Instant;

public record PrescriptionResponse(
        Long id,
        Long appointmentId,
        Long doctorId,
        String doctorName,
        Long patientId,
        String patientName,
        String medication,
        String dosage,
        String instructions,
        Instant issuedAt
) {
}
