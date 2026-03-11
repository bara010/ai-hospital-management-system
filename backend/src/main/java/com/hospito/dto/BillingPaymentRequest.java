package com.hospito.dto;

import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;

public record BillingPaymentRequest(
        @DecimalMin("0.00") BigDecimal amount
) {
}
