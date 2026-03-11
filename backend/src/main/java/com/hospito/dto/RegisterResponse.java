package com.hospito.dto;

public record RegisterResponse(
        String message,
        String email,
        String totpSecret,
        String otpAuthUrl,
        String qrCodeDataUrl
) {
}
