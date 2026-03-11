package com.hospital.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vital_records")
public class VitalRecord {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_gen")
    @SequenceGenerator(name = "seq_gen", sequenceName = "vital_record_seq", allocationSize = 1)
    private Long id;

    private Long patientId;

    // Blood Pressure
    private Integer systolic;
    private Integer diastolic;

    // Blood Sugar (mg/dL)
    private Double bloodSugar;

    // SpO2 (%)
    private Integer spo2;

    // Heart rate (bpm)
    private Integer heartRate;

    // Temperature (°C)
    private Double temperature;

    // Weight (kg)
    private Double weight;

    private String notes;

    @Column(name = "recorded_at")
    private LocalDateTime recordedAt = LocalDateTime.now();

    public VitalRecord() {}

    public Long getId() { return id; }
    public Long getPatientId() { return patientId; }
    public void setPatientId(Long p) { this.patientId = p; }
    public Integer getSystolic() { return systolic; }
    public void setSystolic(Integer s) { this.systolic = s; }
    public Integer getDiastolic() { return diastolic; }
    public void setDiastolic(Integer d) { this.diastolic = d; }
    public Double getBloodSugar() { return bloodSugar; }
    public void setBloodSugar(Double b) { this.bloodSugar = b; }
    public Integer getSpo2() { return spo2; }
    public void setSpo2(Integer s) { this.spo2 = s; }
    public Integer getHeartRate() { return heartRate; }
    public void setHeartRate(Integer h) { this.heartRate = h; }
    public Double getTemperature() { return temperature; }
    public void setTemperature(Double t) { this.temperature = t; }
    public Double getWeight() { return weight; }
    public void setWeight(Double w) { this.weight = w; }
    public String getNotes() { return notes; }
    public void setNotes(String n) { this.notes = n; }
    public LocalDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(LocalDateTime r) { this.recordedAt = r; }
}
