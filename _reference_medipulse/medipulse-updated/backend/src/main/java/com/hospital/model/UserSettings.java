package com.hospital.model;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="user_settings")
public class UserSettings {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "usersettings_seq_gen")
    @SequenceGenerator(name = "usersettings_seq_gen", sequenceName = "user_settings_seq", allocationSize = 1)
    private Long id;
    @Column(unique=true) private Long userId;
    private boolean medicineAlerts=true, moodAlerts=true, appointmentAlerts=true, labAlerts=true, healthTips=true;
    private String language="en";
    @Column(name="updated_at") private LocalDateTime updatedAt=LocalDateTime.now();

    public Long getId(){return id;}
    public Long getUserId(){return userId;} public void setUserId(Long v){userId=v;}
    public boolean isMedicineAlerts(){return medicineAlerts;} public void setMedicineAlerts(boolean v){medicineAlerts=v;}
    public boolean isMoodAlerts(){return moodAlerts;} public void setMoodAlerts(boolean v){moodAlerts=v;}
    public boolean isAppointmentAlerts(){return appointmentAlerts;} public void setAppointmentAlerts(boolean v){appointmentAlerts=v;}
    public boolean isLabAlerts(){return labAlerts;} public void setLabAlerts(boolean v){labAlerts=v;}
    public boolean isHealthTips(){return healthTips;} public void setHealthTips(boolean v){healthTips=v;}
    public String getLanguage(){return language;} public void setLanguage(String v){language=v;}
    public LocalDateTime getUpdatedAt(){return updatedAt;} public void setUpdatedAt(LocalDateTime v){updatedAt=v;}
}
