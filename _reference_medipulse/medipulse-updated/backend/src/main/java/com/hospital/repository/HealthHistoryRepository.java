package com.hospital.repository;

import com.hospital.model.HealthHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HealthHistoryRepository extends JpaRepository<HealthHistory, Long> {
    List<HealthHistory> findByPatientIdOrderByRecordedAtDesc(Long patientId);
    List<HealthHistory> findTop10ByPatientIdOrderByRecordedAtDesc(Long patientId);
}
