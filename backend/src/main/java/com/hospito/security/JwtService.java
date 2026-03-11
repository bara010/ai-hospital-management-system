package com.hospito.security;

import com.hospito.entity.Role;
import com.hospito.entity.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey key;
    private final long accessMinutes;
    private final long loginChallengeMinutes;

    public JwtService(
            @Value("${hospito.jwt.secret}") String secret,
            @Value("${hospito.jwt.expiration-minutes}") long accessMinutes,
            @Value("${hospito.jwt.login-challenge-expiration-minutes}") long loginChallengeMinutes
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessMinutes = accessMinutes;
        this.loginChallengeMinutes = loginChallengeMinutes;
    }

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        Instant exp = now.plus(accessMinutes, ChronoUnit.MINUTES);

        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .claim("type", "ACCESS")
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(key)
                .compact();
    }

    public String generateLoginChallenge(User user) {
        Instant now = Instant.now();
        Instant exp = now.plus(loginChallengeMinutes, ChronoUnit.MINUTES);

        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .claim("type", "LOGIN_CHALLENGE")
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(key)
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isTokenOfType(String token, String expectedType) {
        try {
            Claims claims = parseClaims(token);
            String type = claims.get("type", String.class);
            return expectedType.equals(type);
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    public AuthUser toAuthUser(String token) {
        Claims claims = parseClaims(token);
        if (!"ACCESS".equals(claims.get("type", String.class))) {
            throw new JwtException("Invalid token type");
        }
        Long id = Long.parseLong(claims.getSubject());
        String email = claims.get("email", String.class);
        Role role = Role.valueOf(claims.get("role", String.class));
        return new AuthUser(id, email, role);
    }

    public AuthUser toChallengeUser(String token) {
        Claims claims = parseClaims(token);
        if (!"LOGIN_CHALLENGE".equals(claims.get("type", String.class))) {
            throw new JwtException("Invalid challenge token type");
        }
        Long id = Long.parseLong(claims.getSubject());
        String email = claims.get("email", String.class);
        Role role = Role.valueOf(claims.get("role", String.class));
        return new AuthUser(id, email, role);
    }
}
