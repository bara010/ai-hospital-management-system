package com.hospito.dto;

import com.hospito.entity.DoctorApprovalStatus;
import jakarta.validation.constraints.NotNull;

public record DoctorApprovalUpdateRequest(@NotNull DoctorApprovalStatus status) {
}
