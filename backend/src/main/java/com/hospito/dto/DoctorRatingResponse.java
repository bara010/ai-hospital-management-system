package com.hospito.dto;

import java.time.Instant;

public record DoctorRatingResponse(
        Long id,
        Long appointmentId,
        Long patientId,
        String patientName,
        Integer rating,
        String review,
        Instant createdAt
) {
}
