package com.hospital.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_gen")
    @SequenceGenerator(name = "seq_gen", sequenceName = "audit_log_seq", allocationSize = 1)
    private Long id;

    private String userEmail;
    private String userName;
    private String userRole;
    private String action;       // LOGIN, VIEW_PATIENT, UPDATE_VITALS, GENERATE_INVOICE, etc.
    private String resource;     // What was acted on (e.g. "Patient #3", "Invoice INV-001")
    private String ipAddress;
    private String status;       // SUCCESS, FAILED
    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(name = "performed_at")
    private LocalDateTime performedAt = LocalDateTime.now();

    public AuditLog() {}

    public AuditLog(String userEmail, String userName, String userRole,
                    String action, String resource, String status, String details) {
        this.userEmail = userEmail; this.userName = userName; this.userRole = userRole;
        this.action = action; this.resource = resource;
        this.status = status; this.details = details;
        this.performedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String e) { this.userEmail = e; }
    public String getUserName() { return userName; }
    public void setUserName(String n) { this.userName = n; }
    public String getUserRole() { return userRole; }
    public void setUserRole(String r) { this.userRole = r; }
    public String getAction() { return action; }
    public void setAction(String a) { this.action = a; }
    public String getResource() { return resource; }
    public void setResource(String r) { this.resource = r; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ip) { this.ipAddress = ip; }
    public String getStatus() { return status; }
    public void setStatus(String s) { this.status = s; }
    public String getDetails() { return details; }
    public void setDetails(String d) { this.details = d; }
    public LocalDateTime getPerformedAt() { return performedAt; }
    public void setPerformedAt(LocalDateTime p) { this.performedAt = p; }
}
