package com.hospito.repository;

import com.hospito.entity.PatientProfile;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PatientProfileRepository extends JpaRepository<PatientProfile, Long> {

    @EntityGraph(attributePaths = {"user"})
    Optional<PatientProfile> findByUserId(Long userId);

    @Override
    @EntityGraph(attributePaths = {"user"})
    List<PatientProfile> findAll();
}
