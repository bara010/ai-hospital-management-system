package com.hospito.service;

import com.hospito.dto.AuditLogResponse;
import com.hospito.entity.AuditLog;
import com.hospito.entity.User;
import com.hospito.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(User actor, String action, String entityType, Long entityId, String details) {
        AuditLog entry = new AuditLog();
        if (actor != null) {
            entry.setActorUserId(actor.getId());
            entry.setActorEmail(actor.getEmail());
            entry.setActorRole(actor.getRole() == null ? null : actor.getRole().name());
        } else {
            entry.setActorRole("SYSTEM");
        }

        entry.setAction(action);
        entry.setEntityType(entityType);
        entry.setEntityId(entityId);
        entry.setDetails(details);

        auditLogRepository.save(entry);
    }

    public List<AuditLogResponse> recent(int limit) {
        List<AuditLog> records = limit <= 200
                ? auditLogRepository.findTop200ByOrderByCreatedAtDesc()
                : auditLogRepository.findTop1000ByOrderByCreatedAtDesc();

        return records.stream()
                .limit(Math.max(1, limit))
                .map(this::toResponse)
                .toList();
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getActorUserId(),
                log.getActorEmail(),
                log.getActorRole(),
                log.getAction(),
                log.getEntityType(),
                log.getEntityId(),
                log.getDetails(),
                log.getCreatedAt()
        );
    }
}
