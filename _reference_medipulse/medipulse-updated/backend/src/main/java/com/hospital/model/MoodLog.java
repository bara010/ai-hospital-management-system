package com.hospital.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "mood_logs")
public class MoodLog {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_gen")
    @SequenceGenerator(name = "seq_gen", sequenceName = "mood_log_seq", allocationSize = 1)
    private Long id;

    private Long patientId;
    private String patientName;

    // 1-10 mood score
    private int moodScore;

    // e.g. "😄 Great", "😊 Good", "😐 Okay", "😔 Low", "😢 Bad"
    private String moodLabel;

    @Column(columnDefinition = "TEXT")
    private String note;

    // Was doctor alerted?
    private boolean doctorAlerted = false;

    @Column(name = "logged_at")
    private LocalDateTime loggedAt = LocalDateTime.now();

    public MoodLog() {}

    public Long getId() { return id; }
    public Long getPatientId() { return patientId; }
    public void setPatientId(Long p) { this.patientId = p; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String n) { this.patientName = n; }
    public int getMoodScore() { return moodScore; }
    public void setMoodScore(int m) { this.moodScore = m; }
    public String getMoodLabel() { return moodLabel; }
    public void setMoodLabel(String m) { this.moodLabel = m; }
    public String getNote() { return note; }
    public void setNote(String n) { this.note = n; }
    public boolean isDoctorAlerted() { return doctorAlerted; }
    public void setDoctorAlerted(boolean d) { this.doctorAlerted = d; }
    public LocalDateTime getLoggedAt() { return loggedAt; }
    public void setLoggedAt(LocalDateTime l) { this.loggedAt = l; }
}
