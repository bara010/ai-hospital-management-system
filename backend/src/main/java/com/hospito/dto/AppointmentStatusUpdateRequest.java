package com.hospito.dto;

import com.hospito.entity.AppointmentStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AppointmentStatusUpdateRequest(
        @NotNull AppointmentStatus status,
        @Size(max = 500) String cancellationReason
) {
}
