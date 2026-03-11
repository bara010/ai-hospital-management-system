package com.hospito.dto;

public record LoginChallengeResponse(
        String challengeToken,
        String message
) {
}
