package com.hospito.dto;

import com.hospito.entity.BillingStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record BillingResponse(
        Long id,
        Long patientId,
        String patientName,
        Long appointmentId,
        BigDecimal amount,
        String currency,
        String insuranceProvider,
        String insurancePolicyNumber,
        BigDecimal insuranceCoverageAmount,
        BigDecimal patientPayableAmount,
        BigDecimal amountPaid,
        BillingStatus status,
        String description,
        Instant billedAt,
        Instant paidAt
) {
}
