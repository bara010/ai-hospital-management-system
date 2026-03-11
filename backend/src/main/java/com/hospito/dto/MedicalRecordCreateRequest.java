package com.hospito.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record MedicalRecordCreateRequest(
        @NotNull Long patientId,
        Long appointmentId,
        @NotNull LocalDate recordDate,
        @Size(max = 1000) String diagnosis,
        @NotBlank @Size(max = 4000) String notes,
        @Size(max = 350) String reportPath
) {
}
