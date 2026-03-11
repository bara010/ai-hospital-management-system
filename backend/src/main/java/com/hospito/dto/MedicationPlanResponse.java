package com.hospito.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record MedicationPlanResponse(
        Long id,
        Long patientId,
        String patientName,
        Long doctorId,
        String doctorName,
        Long appointmentId,
        String medication,
        String dosage,
        String instructions,
        Integer frequencyPerDay,
        LocalDate startDate,
        LocalDate endDate,
        Integer totalDoses,
        Integer dosesTaken,
        Double adherencePercent,
        boolean active,
        LocalDateTime lastTakenAt
) {
}
