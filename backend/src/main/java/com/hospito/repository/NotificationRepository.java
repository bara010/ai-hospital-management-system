package com.hospito.repository;

import com.hospito.entity.Notification;
import com.hospito.entity.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    long countByRecipientIdAndReadFalse(Long recipientId);

    boolean existsByRecipientIdAndTypeAndRelatedEntityIdAndCreatedAtAfter(
            Long recipientId,
            NotificationType type,
            Long relatedEntityId,
            Instant createdAt
    );
}
