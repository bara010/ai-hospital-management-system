package com.hospital.model;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="family_contacts")
public class FamilyContact {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "family_seq_gen")
    @SequenceGenerator(name = "family_seq_gen", sequenceName = "family_contact_seq", allocationSize = 1)
    private Long id;
    private Long patientId;
    private String name, relation, phone, email, avatar="👤", status="active";
    private boolean primary=false;
    @Column(columnDefinition="TEXT") private String alertTypes;
    @Column(name="created_at") private LocalDateTime createdAt=LocalDateTime.now();

    public Long getId(){return id;}
    public Long getPatientId(){return patientId;} public void setPatientId(Long v){patientId=v;}
    public String getName(){return name;} public void setName(String v){name=v;}
    public String getRelation(){return relation;} public void setRelation(String v){relation=v;}
    public String getPhone(){return phone;} public void setPhone(String v){phone=v;}
    public String getEmail(){return email;} public void setEmail(String v){email=v;}
    public String getAvatar(){return avatar;} public void setAvatar(String v){avatar=v;}
    public String getStatus(){return status;} public void setStatus(String v){status=v;}
    public boolean isPrimary(){return primary;} public void setPrimary(boolean v){primary=v;}
    public String getAlertTypes(){return alertTypes;} public void setAlertTypes(String v){alertTypes=v;}
    public LocalDateTime getCreatedAt(){return createdAt;}
}
