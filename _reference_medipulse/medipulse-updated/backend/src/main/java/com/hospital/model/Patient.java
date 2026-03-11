package com.hospital.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "patients")
public class Patient {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_gen")
    @SequenceGenerator(name = "seq_gen", sequenceName = "patient_seq", allocationSize = 1)
    private Long id;

    @OneToOne @JoinColumn(name = "user_id")
    private User user;

    private int age;
    private String gender;
    private String address;
    private String bloodGroup;
    private String medicalHistory;
    private boolean hasChronic = false;
    private int prevAdmissions = 0;
    private int noShowCount = 0;
    private double distanceKm = 5.0;
    private String status = "OUTPATIENT";

    // ── NEW HEALTH INPUT FIELDS ─────────────────────────────────────────────
    private double weightKg = 0.0;
    @Column(length = 2000)
    private String symptoms;
    private String symptomDuration;
    @Column(length = 1000)
    private String existingDiseases;
    private String emergencyLevel = "NORMAL";

    // ── SMART ANALYSIS RESULTS ──────────────────────────────────────────────
    @Column(length = 2000)
    private String predictedCondition;
    private String suggestedDepartment;
    private int severityScore = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    @Column(name = "last_analyzed_at")
    private LocalDateTime lastAnalyzedAt;

    public Patient() {}

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bg) { this.bloodGroup = bg; }
    public String getMedicalHistory() { return medicalHistory; }
    public void setMedicalHistory(String h) { this.medicalHistory = h; }
    public boolean isHasChronic() { return hasChronic; }
    public void setHasChronic(boolean h) { this.hasChronic = h; }
    public int getPrevAdmissions() { return prevAdmissions; }
    public void setPrevAdmissions(int p) { this.prevAdmissions = p; }
    public int getNoShowCount() { return noShowCount; }
    public void setNoShowCount(int n) { this.noShowCount = n; }
    public double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(double d) { this.distanceKm = d; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public double getWeightKg() { return weightKg; }
    public void setWeightKg(double w) { this.weightKg = w; }
    public String getSymptoms() { return symptoms; }
    public void setSymptoms(String s) { this.symptoms = s; }
    public String getSymptomDuration() { return symptomDuration; }
    public void setSymptomDuration(String s) { this.symptomDuration = s; }
    public String getExistingDiseases() { return existingDiseases; }
    public void setExistingDiseases(String e) { this.existingDiseases = e; }
    public String getEmergencyLevel() { return emergencyLevel; }
    public void setEmergencyLevel(String e) { this.emergencyLevel = e; }
    public String getPredictedCondition() { return predictedCondition; }
    public void setPredictedCondition(String p) { this.predictedCondition = p; }
    public String getSuggestedDepartment() { return suggestedDepartment; }
    public void setSuggestedDepartment(String s) { this.suggestedDepartment = s; }
    public int getSeverityScore() { return severityScore; }
    public void setSeverityScore(int s) { this.severityScore = s; }
    public LocalDateTime getLastAnalyzedAt() { return lastAnalyzedAt; }
    public void setLastAnalyzedAt(LocalDateTime l) { this.lastAnalyzedAt = l; }
}
