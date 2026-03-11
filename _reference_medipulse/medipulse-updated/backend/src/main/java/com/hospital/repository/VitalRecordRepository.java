package com.hospital.repository;

import com.hospital.model.VitalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VitalRecordRepository extends JpaRepository<VitalRecord, Long> {
    List<VitalRecord> findByPatientIdOrderByRecordedAtDesc(Long patientId);
    List<VitalRecord> findTop7ByPatientIdOrderByRecordedAtDesc(Long patientId);
}
