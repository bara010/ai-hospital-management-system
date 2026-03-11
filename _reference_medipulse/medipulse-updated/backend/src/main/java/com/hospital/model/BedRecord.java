package com.hospital.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bed_records")
public class BedRecord {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_gen")
    @SequenceGenerator(name = "seq_gen", sequenceName = "bed_record_seq", allocationSize = 1)
    private Long id;

    private String ward;          // ICU, General, Pediatric, Maternity, Emergency, Surgical
    private String bedNumber;     // e.g. ICU-01
    // OCCUPIED, VACANT, MAINTENANCE
    private String status = "VACANT";
    private String patientName;
    private Long patientId;
    private String admittedFor;   // reason/diagnosis

    @Column(name = "admitted_at")
    private LocalDateTime admittedAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public BedRecord() {}

    public Long getId() { return id; }
    public String getWard() { return ward; }
    public void setWard(String w) { this.ward = w; }
    public String getBedNumber() { return bedNumber; }
    public void setBedNumber(String b) { this.bedNumber = b; }
    public String getStatus() { return status; }
    public void setStatus(String s) { this.status = s; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String p) { this.patientName = p; }
    public Long getPatientId() { return patientId; }
    public void setPatientId(Long p) { this.patientId = p; }
    public String getAdmittedFor() { return admittedFor; }
    public void setAdmittedFor(String a) { this.admittedFor = a; }
    public LocalDateTime getAdmittedAt() { return admittedAt; }
    public void setAdmittedAt(LocalDateTime a) { this.admittedAt = a; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime u) { this.updatedAt = u; }
}
