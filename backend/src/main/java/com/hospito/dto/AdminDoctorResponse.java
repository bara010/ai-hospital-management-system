package com.hospito.dto;

import com.hospito.entity.DoctorApprovalStatus;

public record AdminDoctorResponse(
        Long doctorId,
        Long userId,
        String fullName,
        String email,
        String phone,
        String specialization,
        String qualification,
        Integer yearsExperience,
        DoctorApprovalStatus approvalStatus
) {
}
