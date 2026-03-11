package com.hospito.controller;

import com.hospito.dto.ChatContactResponse;
import com.hospito.dto.ChatMessageRequest;
import com.hospito.dto.ChatMessageResponse;
import com.hospito.exception.UnauthorizedException;
import com.hospito.security.AuthUser;
import com.hospito.security.SecurityUtils;
import com.hospito.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@PreAuthorize("hasAnyRole('PATIENT','DOCTOR')")
public class MessageController {

    private final ChatService chatService;

    public MessageController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/contacts")
    public ResponseEntity<List<ChatContactResponse>> contacts() {
        AuthUser user = currentUser();
        return ResponseEntity.ok(chatService.contacts(user.getId()));
    }

    @GetMapping("/conversation/{otherUserId}")
    public ResponseEntity<List<ChatMessageResponse>> conversation(@PathVariable Long otherUserId) {
        AuthUser user = currentUser();
        return ResponseEntity.ok(chatService.conversation(user.getId(), otherUserId));
    }

    @PostMapping
    public ResponseEntity<ChatMessageResponse> send(@Valid @RequestBody ChatMessageRequest request) {
        AuthUser user = currentUser();
        return ResponseEntity.ok(chatService.sendMessage(user.getId(), request));
    }

    private AuthUser currentUser() {
        AuthUser user = SecurityUtils.currentUser();
        if (user == null) {
            throw new UnauthorizedException("Authentication required");
        }
        return user;
    }
}
