package com.hospital.repository;

import com.hospital.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findAllByOrderByPerformedAtDesc();
    List<AuditLog> findByUserEmailOrderByPerformedAtDesc(String email);
    List<AuditLog> findByActionOrderByPerformedAtDesc(String action);
    List<AuditLog> findTop100ByOrderByPerformedAtDesc();
}
