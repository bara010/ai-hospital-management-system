package com.hospital.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_gen")
    @SequenceGenerator(name = "seq_gen", sequenceName = "notification_seq", allocationSize = 1)
    private Long id;

    private String type;
    private String title;
    @Column(columnDefinition = "TEXT")
    private String message;
    private String recipientType = "DOCTOR"; // PATIENT or DOCTOR
    private Long patientId;
    private boolean read = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Notification() {}
    public Notification(String type, String title, String message, Long patientId, String recipientType) {
        this.type = type; this.title = title; this.message = message;
        this.patientId = patientId; this.recipientType = recipientType;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getRecipientType() { return recipientType; }
    public void setRecipientType(String r) { this.recipientType = r; }
    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }
    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
