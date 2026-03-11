package com.hospito.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PrescriptionCreateRequest(
        @NotNull Long appointmentId,
        @NotBlank @Size(max = 500) String medication,
        @NotBlank @Size(max = 200) String dosage,
        @NotBlank @Size(max = 2000) String instructions
) {
}
