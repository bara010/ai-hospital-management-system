package com.hospito.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "doctor_profiles")
public class DoctorProfile extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "doctor_profiles_seq_gen")
    @SequenceGenerator(name = "doctor_profiles_seq_gen", sequenceName = "doctor_profiles_seq", allocationSize = 1)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, length = 150)
    private String specialization;

    @Column(length = 200)
    private String qualification;

    @Column(name = "years_experience")
    private Integer yearsExperience;

    @Column(length = 1500)
    private String bio;

    @Column(name = "availability_notes", length = 500)
    private String availabilityNotes;

    @Column(name = "profile_photo_path", length = 350)
    private String profilePhotoPath;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false, length = 20)
    private DoctorApprovalStatus approvalStatus = DoctorApprovalStatus.PENDING;

    @Column(name = "rating_average", precision = 3, scale = 2, nullable = false)
    private BigDecimal ratingAverage = BigDecimal.ZERO;

    @Column(name = "rating_count", nullable = false)
    private Integer ratingCount = 0;

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }

    public String getQualification() {
        return qualification;
    }

    public void setQualification(String qualification) {
        this.qualification = qualification;
    }

    public Integer getYearsExperience() {
        return yearsExperience;
    }

    public void setYearsExperience(Integer yearsExperience) {
        this.yearsExperience = yearsExperience;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getAvailabilityNotes() {
        return availabilityNotes;
    }

    public void setAvailabilityNotes(String availabilityNotes) {
        this.availabilityNotes = availabilityNotes;
    }

    public String getProfilePhotoPath() {
        return profilePhotoPath;
    }

    public void setProfilePhotoPath(String profilePhotoPath) {
        this.profilePhotoPath = profilePhotoPath;
    }

    public DoctorApprovalStatus getApprovalStatus() {
        return approvalStatus;
    }

    public void setApprovalStatus(DoctorApprovalStatus approvalStatus) {
        this.approvalStatus = approvalStatus;
    }

    public BigDecimal getRatingAverage() {
        return ratingAverage;
    }

    public void setRatingAverage(BigDecimal ratingAverage) {
        this.ratingAverage = ratingAverage;
    }

    public Integer getRatingCount() {
        return ratingCount;
    }

    public void setRatingCount(Integer ratingCount) {
        this.ratingCount = ratingCount;
    }
}
