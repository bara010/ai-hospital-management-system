package com.hospito.controller;

import com.hospito.dto.ProfileResponse;
import com.hospito.dto.ProfileUpdateRequest;
import com.hospito.dto.UploadResponse;
import com.hospito.exception.UnauthorizedException;
import com.hospito.security.AuthUser;
import com.hospito.security.SecurityUtils;
import com.hospito.service.FileStorageService;
import com.hospito.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/profile/me")
public class ProfileController {

    private final ProfileService profileService;
    private final FileStorageService fileStorageService;

    public ProfileController(ProfileService profileService, FileStorageService fileStorageService) {
        this.profileService = profileService;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping
    public ResponseEntity<ProfileResponse> profile() {
        AuthUser user = currentUser();
        return ResponseEntity.ok(profileService.getProfile(user.getId()));
    }

    @PutMapping
    public ResponseEntity<ProfileResponse> update(@Valid @RequestBody ProfileUpdateRequest request) {
        AuthUser user = currentUser();
        return ResponseEntity.ok(profileService.updateProfile(user.getId(), request));
    }

    @PostMapping("/photo")
    public ResponseEntity<ProfileResponse> uploadPhoto(@RequestParam("file") MultipartFile file) {
        AuthUser user = currentUser();
        UploadResponse upload = fileStorageService.store(file, "profiles");
        return ResponseEntity.ok(profileService.updateProfilePhoto(user.getId(), upload.filePath()));
    }

    private AuthUser currentUser() {
        AuthUser user = SecurityUtils.currentUser();
        if (user == null) {
            throw new UnauthorizedException("Authentication required");
        }
        return user;
    }
}
