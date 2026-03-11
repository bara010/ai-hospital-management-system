package com.hospito.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record LabOrderCreateRequest(
        @NotNull Long patientId,
        Long appointmentId,
        @NotBlank @Size(max = 250) String testName,
        @Size(max = 1000) String instructions
) {
}
