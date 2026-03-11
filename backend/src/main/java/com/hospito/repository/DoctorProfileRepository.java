package com.hospito.repository;

import com.hospito.entity.DoctorApprovalStatus;
import com.hospito.entity.DoctorProfile;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DoctorProfileRepository extends JpaRepository<DoctorProfile, Long> {

    @EntityGraph(attributePaths = {"user"})
    Optional<DoctorProfile> findByUserId(Long userId);

    @EntityGraph(attributePaths = {"user"})
    List<DoctorProfile> findByApprovalStatus(DoctorApprovalStatus approvalStatus);

    @EntityGraph(attributePaths = {"user"})
    List<DoctorProfile> findByApprovalStatusAndSpecializationContainingIgnoreCase(DoctorApprovalStatus status, String specialization);

    @Override
    @EntityGraph(attributePaths = {"user"})
    List<DoctorProfile> findAll();
}
