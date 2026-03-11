package com.hospito.dto;

import java.time.Instant;

public record AuditLogResponse(
        Long id,
        Long actorUserId,
        String actorEmail,
        String actorRole,
        String action,
        String entityType,
        Long entityId,
        String details,
        Instant createdAt
) {
}
