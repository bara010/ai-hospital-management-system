package com.hospito.repository;

import com.hospito.entity.MedicalRecord;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    @EntityGraph(attributePaths = {"doctor", "doctor.user", "patient", "patient.user"})
    List<MedicalRecord> findByPatientIdOrderByRecordDateDesc(Long patientId);

    @EntityGraph(attributePaths = {"doctor", "doctor.user", "patient", "patient.user"})
    List<MedicalRecord> findByDoctorIdOrderByRecordDateDesc(Long doctorId);
}
