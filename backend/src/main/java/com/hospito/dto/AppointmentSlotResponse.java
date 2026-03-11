package com.hospito.dto;

import java.time.LocalDateTime;

public record AppointmentSlotResponse(
        LocalDateTime startTime,
        LocalDateTime endTime
) {
}
