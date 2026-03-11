package com.hospital.repository;

import com.hospital.model.MoodLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MoodLogRepository extends JpaRepository<MoodLog, Long> {
    List<MoodLog> findByPatientIdOrderByLoggedAtDesc(Long patientId);
    List<MoodLog> findTop30ByPatientIdOrderByLoggedAtDesc(Long patientId);
    List<MoodLog> findAllByOrderByLoggedAtDesc();
}
