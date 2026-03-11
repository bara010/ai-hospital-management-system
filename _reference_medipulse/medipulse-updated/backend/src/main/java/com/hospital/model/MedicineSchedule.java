package com.hospital.model;

import jakarta.persistence.*;

@Entity
@Table(name = "medicine_schedules")
public class MedicineSchedule {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_gen")
    @SequenceGenerator(name = "seq_gen", sequenceName = "medicine_schedule_seq", allocationSize = 1)
    private Long id;

    private Long patientId;
    private String patientName;
    private String medicineName;
    private String dose;
    private int reminderHour;
    private int reminderMinute = 0;
    private String timeOfDay; // morning, afternoon, evening, night
    private boolean active = true;

    public MedicineSchedule() {}

    public Long getId() { return id; }
    public Long getPatientId() { return patientId; }
    public void setPatientId(Long id) { this.patientId = id; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String n) { this.patientName = n; }
    public String getMedicineName() { return medicineName; }
    public void setMedicineName(String m) { this.medicineName = m; }
    public String getDose() { return dose; }
    public void setDose(String d) { this.dose = d; }
    public int getReminderHour() { return reminderHour; }
    public void setReminderHour(int h) { this.reminderHour = h; }
    public int getReminderMinute() { return reminderMinute; }
    public void setReminderMinute(int m) { this.reminderMinute = m; }
    public String getTimeOfDay() { return timeOfDay; }
    public void setTimeOfDay(String t) { this.timeOfDay = t; }
    public boolean isActive() { return active; }
    public void setActive(boolean a) { this.active = a; }
}
