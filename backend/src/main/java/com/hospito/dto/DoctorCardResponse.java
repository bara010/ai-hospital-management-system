package com.hospito.dto;

import com.hospito.entity.DoctorApprovalStatus;

import java.math.BigDecimal;
import java.util.List;

public record DoctorCardResponse(
        Long id,
        String doctorName,
        String specialization,
        String availability,
        BigDecimal rating,
        Integer ratingCount,
        String profilePictureUrl,
        DoctorApprovalStatus approvalStatus,
        List<DoctorAvailabilityResponse> schedules
) {
}
