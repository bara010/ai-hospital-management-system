package com.hospital.model;

import jakarta.persistence.*;

@Entity
@Table(name = "doctors")
public class Doctor {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_gen")
    @SequenceGenerator(name = "seq_gen", sequenceName = "doctor_seq", allocationSize = 1)
    private Long id;

    @OneToOne @JoinColumn(name = "user_id")
    private User user;

    private String specialization;
    private String department;
    private String qualification;
    private String availability = "MON-FRI 9AM-5PM";
    private double consultationFee = 500.0;

    public Doctor() {}

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getSpecialization() { return specialization; }
    public void setSpecialization(String s) { this.specialization = s; }
    public String getDepartment() { return department; }
    public void setDepartment(String d) { this.department = d; }
    public String getQualification() { return qualification; }
    public void setQualification(String q) { this.qualification = q; }
    public String getAvailability() { return availability; }
    public void setAvailability(String a) { this.availability = a; }
    public double getConsultationFee() { return consultationFee; }
    public void setConsultationFee(double f) { this.consultationFee = f; }
}
