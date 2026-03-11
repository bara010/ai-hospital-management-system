package com.hospito.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "medication_plans")
public class MedicationPlan extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "medication_plans_seq_gen")
    @SequenceGenerator(name = "medication_plans_seq_gen", sequenceName = "medication_plans_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private PatientProfile patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private DoctorProfile doctor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @Column(nullable = false, length = 500)
    private String medication;

    @Column(nullable = false, length = 200)
    private String dosage;

    @Column(length = 2000)
    private String instructions;

    @Column(name = "frequency_per_day", nullable = false)
    private Integer frequencyPerDay;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "total_doses", nullable = false)
    private Integer totalDoses;

    @Column(name = "doses_taken", nullable = false)
    private Integer dosesTaken = 0;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "last_taken_at")
    private LocalDateTime lastTakenAt;

    public Long getId() {
        return id;
    }

    public PatientProfile getPatient() {
        return patient;
    }

    public void setPatient(PatientProfile patient) {
        this.patient = patient;
    }

    public DoctorProfile getDoctor() {
        return doctor;
    }

    public void setDoctor(DoctorProfile doctor) {
        this.doctor = doctor;
    }

    public Appointment getAppointment() {
        return appointment;
    }

    public void setAppointment(Appointment appointment) {
        this.appointment = appointment;
    }

    public String getMedication() {
        return medication;
    }

    public void setMedication(String medication) {
        this.medication = medication;
    }

    public String getDosage() {
        return dosage;
    }

    public void setDosage(String dosage) {
        this.dosage = dosage;
    }

    public String getInstructions() {
        return instructions;
    }

    public void setInstructions(String instructions) {
        this.instructions = instructions;
    }

    public Integer getFrequencyPerDay() {
        return frequencyPerDay;
    }

    public void setFrequencyPerDay(Integer frequencyPerDay) {
        this.frequencyPerDay = frequencyPerDay;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public Integer getTotalDoses() {
        return totalDoses;
    }

    public void setTotalDoses(Integer totalDoses) {
        this.totalDoses = totalDoses;
    }

    public Integer getDosesTaken() {
        return dosesTaken;
    }

    public void setDosesTaken(Integer dosesTaken) {
        this.dosesTaken = dosesTaken;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public LocalDateTime getLastTakenAt() {
        return lastTakenAt;
    }

    public void setLastTakenAt(LocalDateTime lastTakenAt) {
        this.lastTakenAt = lastTakenAt;
    }
}
