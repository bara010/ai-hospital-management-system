package com.hospito.controller;

import com.hospito.dto.NotificationResponse;
import com.hospito.exception.UnauthorizedException;
import com.hospito.security.AuthUser;
import com.hospito.security.SecurityUtils;
import com.hospito.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications/me")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> myNotifications() {
        AuthUser user = currentUser();
        return ResponseEntity.ok(notificationService.getNotifications(user.getId()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount() {
        AuthUser user = currentUser();
        return ResponseEntity.ok(Map.of("unreadCount", notificationService.unreadCount(user.getId())));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<NotificationResponse> markRead(@PathVariable Long notificationId) {
        AuthUser user = currentUser();
        return ResponseEntity.ok(notificationService.markRead(user.getId(), notificationId));
    }

    private AuthUser currentUser() {
        AuthUser user = SecurityUtils.currentUser();
        if (user == null) {
            throw new UnauthorizedException("Authentication required");
        }
        return user;
    }
}
