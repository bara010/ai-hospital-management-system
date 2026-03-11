package com.hospito.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "lab_orders")
public class LabOrder extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "lab_orders_seq_gen")
    @SequenceGenerator(name = "lab_orders_seq_gen", sequenceName = "lab_orders_seq", allocationSize = 1)
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

    @Column(name = "test_name", nullable = false, length = 250)
    private String testName;

    @Column(length = 1000)
    private String instructions;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private LabOrderStatus status = LabOrderStatus.ORDERED;

    @Column(name = "status_note", length = 500)
    private String statusNote;

    @Column(name = "result_summary", length = 4000)
    private String resultSummary;

    @Column(name = "result_file_path", length = 350)
    private String resultFilePath;

    @Column(name = "result_at")
    private Instant resultAt;

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

    public String getTestName() {
        return testName;
    }

    public void setTestName(String testName) {
        this.testName = testName;
    }

    public String getInstructions() {
        return instructions;
    }

    public void setInstructions(String instructions) {
        this.instructions = instructions;
    }

    public LabOrderStatus getStatus() {
        return status;
    }

    public void setStatus(LabOrderStatus status) {
        this.status = status;
    }

    public String getStatusNote() {
        return statusNote;
    }

    public void setStatusNote(String statusNote) {
        this.statusNote = statusNote;
    }

    public String getResultSummary() {
        return resultSummary;
    }

    public void setResultSummary(String resultSummary) {
        this.resultSummary = resultSummary;
    }

    public String getResultFilePath() {
        return resultFilePath;
    }

    public void setResultFilePath(String resultFilePath) {
        this.resultFilePath = resultFilePath;
    }

    public Instant getResultAt() {
        return resultAt;
    }

    public void setResultAt(Instant resultAt) {
        this.resultAt = resultAt;
    }
}
