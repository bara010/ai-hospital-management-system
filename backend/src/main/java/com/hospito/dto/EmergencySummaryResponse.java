package com.hospito.dto;

import java.math.BigDecimal;
import java.util.List;

public record EmergencySummaryResponse(
        Long patientId,
        String patientName,
        String bloodGroup,
        String medicalProblems,
        BigDecimal heightCm,
        BigDecimal weightKg,
        String emergencyContactName,
        String emergencyContactPhone,
        List<String> recentDiagnoses
) {
}
