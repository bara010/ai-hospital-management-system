package com.hospito.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record BillingCreateRequest(
        @NotNull Long patientId,
        Long appointmentId,
        @NotNull @DecimalMin("0.00") BigDecimal amount,
        @Size(max = 5) String currency,
        @Size(max = 1000) String description,
        @Size(max = 150) String insuranceProvider,
        @Size(max = 120) String insurancePolicyNumber,
        @DecimalMin("0.00") BigDecimal insuranceCoverageAmount
) {
}
