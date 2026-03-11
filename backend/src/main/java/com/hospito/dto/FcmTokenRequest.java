package com.hospito.dto;

import jakarta.validation.constraints.NotBlank;

public record FcmTokenRequest(@NotBlank String token) {
}
