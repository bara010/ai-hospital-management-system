package com.hospito.dto;

import java.time.Instant;

public record ChatMessageResponse(
        Long id,
        Long senderId,
        String senderName,
        Long recipientId,
        String recipientName,
        String message,
        String attachmentUrl,
        String attachmentName,
        Instant createdAt,
        boolean read
) {
}
