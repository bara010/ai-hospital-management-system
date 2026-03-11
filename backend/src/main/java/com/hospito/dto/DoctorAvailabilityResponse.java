package com.hospito.dto;

import java.time.LocalTime;

public record DoctorAvailabilityResponse(
        Long id,
        Integer dayOfWeek,
        LocalTime startTime,
        LocalTime endTime,
        boolean active
) {
}
