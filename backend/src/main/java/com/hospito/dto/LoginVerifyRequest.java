package com.hospito.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginVerifyRequest(
        @NotBlank String challengeToken,
        @NotBlank String code
) {
}
