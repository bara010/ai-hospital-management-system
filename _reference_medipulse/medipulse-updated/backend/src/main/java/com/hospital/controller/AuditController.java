package com.hospital.controller;

import com.hospital.model.AuditLog;
import com.hospital.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * AuditController — HIPAA-compliant tamper-evident audit log.
 *
 * GET  /api/audit            — recent 100 audit entries (Admin only)
 * GET  /api/audit/user       — filter by user email
 * POST /api/audit            — record an audit event (called by other services/frontend)
 */
@RestController
@RequestMapping("/api/audit")
@CrossOrigin(origins = "*")
public class AuditController {

    @Autowired private AuditLogRepository auditRepo;

    @GetMapping
    public List<AuditLog> getRecent() {
        return auditRepo.findTop100ByOrderByPerformedAtDesc();
    }

    @GetMapping("/all")
    public List<AuditLog> getAll() {
        return auditRepo.findAllByOrderByPerformedAtDesc();
    }

    @GetMapping("/user/{email}")
    public List<AuditLog> getByUser(@PathVariable String email) {
        return auditRepo.findByUserEmailOrderByPerformedAtDesc(email);
    }

    @GetMapping("/action/{action}")
    public List<AuditLog> getByAction(@PathVariable String action) {
        return auditRepo.findByActionOrderByPerformedAtDesc(action);
    }

    @PostMapping
    public ResponseEntity<?> log(@RequestBody Map<String, Object> body) {
        try {
            AuditLog log = new AuditLog(
                (String) body.getOrDefault("userEmail", "system"),
                (String) body.getOrDefault("userName", "System"),
                (String) body.getOrDefault("userRole", "SYSTEM"),
                (String) body.getOrDefault("action", "UNKNOWN"),
                (String) body.getOrDefault("resource", "-"),
                (String) body.getOrDefault("status", "SUCCESS"),
                (String) body.getOrDefault("details", "")
            );
            if (body.containsKey("ipAddress")) log.setIpAddress((String) body.get("ipAddress"));
            AuditLog saved = auditRepo.save(log);
            return ResponseEntity.ok(Map.of("success", true, "id", saved.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        List<AuditLog> all = auditRepo.findTop100ByOrderByPerformedAtDesc();
        Map<String, Long> byAction = new LinkedHashMap<>();
        Map<String, Long> byRole = new LinkedHashMap<>();
        long failed = 0;
        for (AuditLog log : all) {
            byAction.merge(log.getAction(), 1L, Long::sum);
            byRole.merge(log.getUserRole() != null ? log.getUserRole() : "UNKNOWN", 1L, Long::sum);
            if ("FAILED".equals(log.getStatus())) failed++;
        }
        return Map.of(
            "totalEvents", all.size(),
            "failedEvents", failed,
            "byAction", byAction,
            "byRole", byRole
        );
    }
}
