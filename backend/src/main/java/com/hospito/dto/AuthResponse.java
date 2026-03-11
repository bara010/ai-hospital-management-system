package com.hospito.dto;

public record AuthResponse(
        String accessToken,
        String tokenType,
        UserDto user
) {
}
