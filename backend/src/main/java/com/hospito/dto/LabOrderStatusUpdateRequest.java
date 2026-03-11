package com.hospito.dto;

import com.hospito.entity.LabOrderStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record LabOrderStatusUpdateRequest(
        @NotNull LabOrderStatus status,
        @Size(max = 500) String statusNote
) {
}
