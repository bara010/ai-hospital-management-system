package com.hospital.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "online_consults")
public class OnlineConsult {

    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "online_consult_seq_gen")
    @SequenceGenerator(name = "online_consult_seq_gen", sequenceName = "online_consult_seq", allocationSize = 1)
    private Long id;

    private Long patientId;
    private String patientName;
    private Long doctorId;        // null until a doctor accepts
    private String doctorName;
    private String doctorDepartment;
    private String doctorSpecialization;
    private String doctorQualification;
    private Double doctorFee;

    @Column(columnDefinition = "TEXT")
    private String symptoms;

    // WAITING | ACCEPTED | IN_PROGRESS | COMPLETED | CANCELLED
    private String status = "WAITING";

    // Simple text chat: JSON array stored as text
    @Column(columnDefinition = "TEXT")
    private String chatJson = "[]";

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime acceptedAt;
    private LocalDateTime endedAt;

    public OnlineConsult() {}

    // ── Getters & Setters ───────────────────────────────────────────────────
    public Long getId()                          { return id; }
    public Long getPatientId()                   { return patientId; }
    public void setPatientId(Long v)             { this.patientId = v; }
    public String getPatientName()               { return patientName; }
    public void setPatientName(String v)         { this.patientName = v; }
    public Long getDoctorId()                    { return doctorId; }
    public void setDoctorId(Long v)              { this.doctorId = v; }
    public String getDoctorName()                { return doctorName; }
    public void setDoctorName(String v)          { this.doctorName = v; }
    public String getDoctorDepartment()          { return doctorDepartment; }
    public void setDoctorDepartment(String v)    { this.doctorDepartment = v; }
    public String getDoctorSpecialization()      { return doctorSpecialization; }
    public void setDoctorSpecialization(String v){ this.doctorSpecialization = v; }
    public String getDoctorQualification()       { return doctorQualification; }
    public void setDoctorQualification(String v) { this.doctorQualification = v; }
    public Double getDoctorFee()                 { return doctorFee; }
    public void setDoctorFee(Double v)           { this.doctorFee = v; }
    public String getSymptoms()                  { return symptoms; }
    public void setSymptoms(String v)            { this.symptoms = v; }
    public String getStatus()                    { return status; }
    public void setStatus(String v)              { this.status = v; }
    public String getChatJson()                  { return chatJson; }
    public void setChatJson(String v)            { this.chatJson = v; }
    public LocalDateTime getCreatedAt()          { return createdAt; }
    public void setCreatedAt(LocalDateTime v)    { this.createdAt = v; }
    public LocalDateTime getAcceptedAt()         { return acceptedAt; }
    public void setAcceptedAt(LocalDateTime v)   { this.acceptedAt = v; }
    public LocalDateTime getEndedAt()            { return endedAt; }
    public void setEndedAt(LocalDateTime v)      { this.endedAt = v; }
}
