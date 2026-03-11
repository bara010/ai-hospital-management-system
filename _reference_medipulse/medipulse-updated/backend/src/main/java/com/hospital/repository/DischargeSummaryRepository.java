package com.hospital.repository;

import com.hospital.model.DischargeSummaryRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DischargeSummaryRepository extends JpaRepository<DischargeSummaryRecord, Long> {
    List<DischargeSummaryRecord> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    List<DischargeSummaryRecord> findAllByOrderByCreatedAtDesc();
}
