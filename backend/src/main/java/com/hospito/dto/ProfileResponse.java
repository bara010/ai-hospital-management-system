package com.hospito.dto;

import com.hospito.entity.DoctorApprovalStatus;
import com.hospito.entity.Role;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ProfileResponse(
        Long userId,
        Role role,
        String email,
        String firstName,
        String lastName,
        String phone,
        String address,
        String bloodGroup,
        String allergies,
        BigDecimal heightCm,
        BigDecimal weightKg,
        String emergencyContactName,
        String emergencyContactPhone,
        LocalDate dateOfBirth,
        String specialization,
        String qualification,
        Integer yearsExperience,
        String bio,
        String availabilityNotes,
        DoctorApprovalStatus approvalStatus,
        BigDecimal ratingAverage,
        Integer ratingCount,
        String profilePictureUrl
) {
}
