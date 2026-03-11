package com.hospito.dto;

import com.hospito.entity.AppointmentStatus;

import java.time.LocalDateTime;

public record AppointmentResponse(
        Long id,
        Long patientId,
        String patientName,
        Long doctorId,
        String doctorName,
        String specialization,
        LocalDateTime startTime,
        LocalDateTime endTime,
        String reason,
        AppointmentStatus status,
        String meetingRoomId,
        String cancellationReason
) {
}
