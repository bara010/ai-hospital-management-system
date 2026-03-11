package com.hospital.repository;

import com.hospital.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByReadFalseOrderByCreatedAtDesc();
    List<Notification> findAllByOrderByCreatedAtDesc();
    List<Notification> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    List<Notification> findByPatientIdAndReadFalse(Long patientId);
    List<Notification> findByRecipientTypeAndReadFalse(String type);
    long countByReadFalse();
    long countByPatientIdAndReadFalse(Long patientId);

    @Modifying @Transactional
    @Query("UPDATE Notification n SET n.read = true WHERE n.read = false")
    int markAllAsRead();

    @Modifying @Transactional
    @Query("UPDATE Notification n SET n.read = true WHERE n.patientId = :patientId AND n.read = false")
    int markAllAsReadForPatient(Long patientId);
}
