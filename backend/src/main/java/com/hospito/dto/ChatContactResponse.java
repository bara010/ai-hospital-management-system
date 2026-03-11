package com.hospito.dto;

import com.hospito.entity.Role;

import java.time.Instant;

public record ChatContactResponse(
        Long userId,
        String fullName,
        String email,
        Role role,
        String profilePictureUrl,
        String specialization,
        String latestMessage,
        Instant latestMessageAt
) {
}
