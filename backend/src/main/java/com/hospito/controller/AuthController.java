package com.hospito.controller;

import com.hospito.dto.*;
import com.hospito.exception.UnauthorizedException;
import com.hospito.security.AuthUser;
import com.hospito.security.SecurityUtils;
import com.hospito.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/register/verify-totp")
    public ResponseEntity<SimpleMessageResponse> verifyRegistrationTotp(@Valid @RequestBody VerifyTotpRequest request) {
        return ResponseEntity.ok(authService.verifyRegistrationTotp(request));
    }

    @PostMapping("/login/start")
    public ResponseEntity<LoginChallengeResponse> loginStart(@Valid @RequestBody LoginStartRequest request) {
        return ResponseEntity.ok(authService.loginStart(request));
    }

    @PostMapping("/login/verify-totp")
    public ResponseEntity<AuthResponse> loginVerify(@Valid @RequestBody LoginVerifyRequest request) {
        return ResponseEntity.ok(authService.loginVerify(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginWithTotpRequest request) {
        return ResponseEntity.ok(authService.loginWithTotp(request));
    }

    @PostMapping("/fcm-token")
    public ResponseEntity<SimpleMessageResponse> setFcmToken(@Valid @RequestBody FcmTokenRequest request) {
        AuthUser user = SecurityUtils.currentUser();
        if (user == null) {
            throw new UnauthorizedException("Authentication required");
        }
        return ResponseEntity.ok(authService.updateFcmToken(user.getId(), request));
    }
}
