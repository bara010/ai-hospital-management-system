package com.hospito.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record MedicationPlanCreateRequest(
        @NotNull Long patientId,
        Long appointmentId,
        @NotBlank @Size(max = 500) String medication,
        @NotBlank @Size(max = 200) String dosage,
        @Size(max = 2000) String instructions,
        @NotNull @Min(1) @Max(12) Integer frequencyPerDay,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate
) {
}
