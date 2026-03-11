package com.hospito.controller;

import com.hospito.dto.AppointmentResponse;
import com.hospito.exception.UnauthorizedException;
import com.hospito.security.AuthUser;
import com.hospito.security.SecurityUtils;
import com.hospito.service.AppointmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping("/{appointmentId}")
    public ResponseEntity<AppointmentResponse> appointment(@PathVariable Long appointmentId) {
        AuthUser user = SecurityUtils.currentUser();
        if (user == null) {
            throw new UnauthorizedException("Authentication required");
        }
        return ResponseEntity.ok(appointmentService.getAppointmentForUser(user.getId(), user.getRole(), appointmentId));
    }
}
