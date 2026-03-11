package com.hospito.dto;

public record PatientSummaryResponse(
        Long patientId,
        Long userId,
        String fullName,
        String email,
        String phone,
        String bloodGroup,
        String emergencyContactName,
        String emergencyContactPhone,
        String profilePictureUrl
) {
}
