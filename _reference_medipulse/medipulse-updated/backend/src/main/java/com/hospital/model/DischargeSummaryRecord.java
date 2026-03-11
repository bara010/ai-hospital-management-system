package com.hospital.model;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="discharge_summaries")
public class DischargeSummaryRecord {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "discharge_seq_gen")
    @SequenceGenerator(name = "discharge_seq_gen", sequenceName = "discharge_seq", allocationSize = 1)
    private Long id;
    private Long patientId;
    private String patientName, age, gender, admissionDate, dischargeDate, doctorName, followUpDate;
    @Column(columnDefinition="TEXT") private String admissionDiagnosis, finalDiagnosis, treatmentGiven, medicationsOnDischarge, specialInstructions, summaryText;
    @Column(name="created_at") private LocalDateTime createdAt=LocalDateTime.now();

    public Long getId(){return id;}
    public Long getPatientId(){return patientId;} public void setPatientId(Long v){patientId=v;}
    public String getPatientName(){return patientName;} public void setPatientName(String v){patientName=v;}
    public String getAge(){return age;} public void setAge(String v){age=v;}
    public String getGender(){return gender;} public void setGender(String v){gender=v;}
    public String getAdmissionDate(){return admissionDate;} public void setAdmissionDate(String v){admissionDate=v;}
    public String getDischargeDate(){return dischargeDate;} public void setDischargeDate(String v){dischargeDate=v;}
    public String getDoctorName(){return doctorName;} public void setDoctorName(String v){doctorName=v;}
    public String getFollowUpDate(){return followUpDate;} public void setFollowUpDate(String v){followUpDate=v;}
    public String getAdmissionDiagnosis(){return admissionDiagnosis;} public void setAdmissionDiagnosis(String v){admissionDiagnosis=v;}
    public String getFinalDiagnosis(){return finalDiagnosis;} public void setFinalDiagnosis(String v){finalDiagnosis=v;}
    public String getTreatmentGiven(){return treatmentGiven;} public void setTreatmentGiven(String v){treatmentGiven=v;}
    public String getMedicationsOnDischarge(){return medicationsOnDischarge;} public void setMedicationsOnDischarge(String v){medicationsOnDischarge=v;}
    public String getSpecialInstructions(){return specialInstructions;} public void setSpecialInstructions(String v){specialInstructions=v;}
    public String getSummaryText(){return summaryText;} public void setSummaryText(String v){summaryText=v;}
    public LocalDateTime getCreatedAt(){return createdAt;}
}
