package com.hospito.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ChatMessageRequest(
        @NotNull Long recipientId,
        @Size(max = 2000) String message,
        @Size(max = 500) String attachmentPath,
        @Size(max = 300) String attachmentName
) {
}
