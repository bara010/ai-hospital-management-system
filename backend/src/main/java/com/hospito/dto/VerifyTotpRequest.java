package com.hospito.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record VerifyTotpRequest(
        @NotBlank @Email String email,
        @NotBlank String code
) {
}
