package com.hospito.service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.hospito.dto.NotificationResponse;
import com.hospito.entity.Notification;
import com.hospito.entity.NotificationType;
import com.hospito.entity.User;
import com.hospito.exception.ForbiddenException;
import com.hospito.exception.ResourceNotFoundException;
import com.hospito.repository.NotificationRepository;
import com.hospito.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Notification createNotification(
            User recipient,
            String title,
            String message,
            NotificationType type,
            Long relatedEntityId
    ) {
        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setRelatedEntityId(relatedEntityId);
        notification.setRead(false);
        Notification saved = notificationRepository.save(notification);

        sendPushIfAvailable(recipient, title, message, relatedEntityId);
        return saved;
    }

    public List<NotificationResponse> getNotifications(Long userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public long unreadCount(Long userId) {
        return notificationRepository.countByRecipientIdAndReadFalse(userId);
    }

    @Transactional
    public NotificationResponse markRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        if (!notification.getRecipient().getId().equals(userId)) {
            throw new ForbiddenException("Cannot modify another user's notification");
        }

        notification.setRead(true);
        return toResponse(notificationRepository.save(notification));
    }

    private void sendPushIfAvailable(User recipient, String title, String body, Long relatedEntityId) {
        if (recipient.getFcmToken() == null || recipient.getFcmToken().isBlank()) {
            return;
        }

        if (FirebaseApp.getApps().isEmpty()) {
            return;
        }

        try {
            Message.Builder builder = Message.builder()
                    .setToken(recipient.getFcmToken())
                    .putData("title", title)
                    .putData("body", body)
                    .putData("recipientId", recipient.getId().toString());

            if (relatedEntityId != null) {
                builder.putData("relatedEntityId", relatedEntityId.toString());
            }

            FirebaseMessaging.getInstance().send(builder.build());
        } catch (Exception ignored) {
            // Silent fail for push delivery; notification remains stored in DB.
        }
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.getRelatedEntityId(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
