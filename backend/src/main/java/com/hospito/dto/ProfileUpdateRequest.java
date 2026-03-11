package com.hospito.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ProfileUpdateRequest(
        @Size(max = 100) String firstName,
        @Size(max = 100) String lastName,
        @Size(max = 20) String phone,
        @Size(max = 500) String address,
        @Size(max = 5) String bloodGroup,
        @Size(max = 1000) String allergies,
        @DecimalMin(value = "20.0") @DecimalMax(value = "300.0") BigDecimal heightCm,
        @DecimalMin(value = "1.0") @DecimalMax(value = "500.0") BigDecimal weightKg,
        @Size(max = 120) String emergencyContactName,
        @Size(max = 20) String emergencyContactPhone,
        LocalDate dateOfBirth,
        @Size(max = 150) String specialization,
        @Size(max = 200) String qualification,
        Integer yearsExperience,
        @Size(max = 1500) String bio,
        @Size(max = 500) String availabilityNotes
) {
}
