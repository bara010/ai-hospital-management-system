package com.hospito.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginWithTotpRequest(
        @NotBlank @Email String email,
        @NotBlank String password,
        @NotBlank String code
) {
}
