package com.hospital.model;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="telemedicine_sessions")
public class TelemedicineSession {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "telemedicine_seq_gen")
    @SequenceGenerator(name = "telemedicine_seq_gen", sequenceName = "telemedicine_seq", allocationSize = 1)
    private Long id;
    private Long patientId;
    private String patientName, doctorName, specialty, doctorIcon="👨‍⚕️", roomId;
    private String sessionDate, sessionTime, duration, type, status="scheduled";
    private int durationMinutes=0;
    @Column(columnDefinition="TEXT") private String notes;
    @Column(name="created_at") private LocalDateTime createdAt=LocalDateTime.now();

    public Long getId(){return id;}
    public Long getPatientId(){return patientId;} public void setPatientId(Long v){patientId=v;}
    public String getPatientName(){return patientName;} public void setPatientName(String v){patientName=v;}
    public String getDoctorName(){return doctorName;} public void setDoctorName(String v){doctorName=v;}
    public String getSpecialty(){return specialty;} public void setSpecialty(String v){specialty=v;}
    public String getDoctorIcon(){return doctorIcon;} public void setDoctorIcon(String v){doctorIcon=v;}
    public String getRoomId(){return roomId;} public void setRoomId(String v){roomId=v;}
    public String getSessionDate(){return sessionDate;} public void setSessionDate(String v){sessionDate=v;}
    public String getSessionTime(){return sessionTime;} public void setSessionTime(String v){sessionTime=v;}
    public String getDuration(){return duration;} public void setDuration(String v){duration=v;}
    public String getType(){return type;} public void setType(String v){type=v;}
    public String getStatus(){return status;} public void setStatus(String v){status=v;}
    public int getDurationMinutes(){return durationMinutes;} public void setDurationMinutes(int v){durationMinutes=v;}
    public String getNotes(){return notes;} public void setNotes(String v){notes=v;}
    public LocalDateTime getCreatedAt(){return createdAt;}
}
