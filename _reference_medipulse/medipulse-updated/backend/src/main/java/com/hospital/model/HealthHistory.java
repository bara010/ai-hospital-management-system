package com.hospital.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Stores a snapshot of a patient's health analysis each time they submit symptoms.
 * Used for health trend tracking on the dashboard.
 */
@Entity
@Table(name = "health_history")
public class HealthHistory {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_gen")
    @SequenceGenerator(name = "seq_gen", sequenceName = "health_history_seq", allocationSize = 1)
    private Long id;

    @ManyToOne @JoinColumn(name = "patient_id")
    private Patient patient;

    @Column(length = 2000)
    private String symptoms;
    private String symptomDuration;
    @Column(length = 1000)
    private String existingDiseases;
    private String emergencyLevel;
    private double weightKg;
    @Column(length = 2000)
    private String predictedCondition;
    private String suggestedDepartment;
    private int severityScore;
    private LocalDateTime recordedAt = LocalDateTime.now();

    public HealthHistory() {}

    public Long getId() { return id; }
    public Patient getPatient() { return patient; }
    public void setPatient(Patient p) { this.patient = p; }
    public String getSymptoms() { return symptoms; }
    public void setSymptoms(String s) { this.symptoms = s; }
    public String getSymptomDuration() { return symptomDuration; }
    public void setSymptomDuration(String s) { this.symptomDuration = s; }
    public String getExistingDiseases() { return existingDiseases; }
    public void setExistingDiseases(String e) { this.existingDiseases = e; }
    public String getEmergencyLevel() { return emergencyLevel; }
    public void setEmergencyLevel(String e) { this.emergencyLevel = e; }
    public double getWeightKg() { return weightKg; }
    public void setWeightKg(double w) { this.weightKg = w; }
    public String getPredictedCondition() { return predictedCondition; }
    public void setPredictedCondition(String p) { this.predictedCondition = p; }
    public String getSuggestedDepartment() { return suggestedDepartment; }
    public void setSuggestedDepartment(String s) { this.suggestedDepartment = s; }
    public int getSeverityScore() { return severityScore; }
    public void setSeverityScore(int s) { this.severityScore = s; }
    public LocalDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(LocalDateTime r) { this.recordedAt = r; }
}
