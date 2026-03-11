package com.hospito.repository;

import com.hospito.entity.BillingRecord;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BillingRecordRepository extends JpaRepository<BillingRecord, Long> {

    @EntityGraph(attributePaths = {"patient", "patient.user", "appointment"})
    List<BillingRecord> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    @EntityGraph(attributePaths = {"patient", "patient.user", "appointment"})
    List<BillingRecord> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"patient", "patient.user", "appointment"})
    Optional<BillingRecord> findById(Long id);
}
