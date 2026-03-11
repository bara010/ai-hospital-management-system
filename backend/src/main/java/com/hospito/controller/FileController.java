package com.hospito.controller;

import com.hospito.dto.UploadResponse;
import com.hospito.service.FileStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileStorageService fileStorageService;

    public FileController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @PostMapping("/reports")
    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
    public ResponseEntity<UploadResponse> uploadReport(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(fileStorageService.store(file, "reports"));
    }

    @PostMapping("/chat")
    @PreAuthorize("hasAnyRole('DOCTOR','PATIENT')")
    public ResponseEntity<UploadResponse> uploadChatAttachment(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(fileStorageService.store(file, "chat"));
    }
}
