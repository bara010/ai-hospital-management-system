package com.hospito.dto;

import com.hospito.entity.NotificationType;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        String title,
        String message,
        NotificationType type,
        Long relatedEntityId,
        boolean read,
        Instant createdAt
) {
}
