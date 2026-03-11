package com.hospital.repository;

import com.hospital.model.TelemedicineSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TelemedicineSessionRepository extends JpaRepository<TelemedicineSession, Long> {
    List<TelemedicineSession> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    List<TelemedicineSession> findAllByOrderByCreatedAtDesc();
}
