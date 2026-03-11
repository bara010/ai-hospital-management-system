package com.hospito.repository;

import com.hospito.entity.Prescription;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    @EntityGraph(attributePaths = {"doctor", "doctor.user", "patient", "patient.user", "appointment"})
    List<Prescription> findByPatientIdOrderByIssuedAtDesc(Long patientId);

    @EntityGraph(attributePaths = {"doctor", "doctor.user", "patient", "patient.user", "appointment"})
    List<Prescription> findByDoctorIdOrderByIssuedAtDesc(Long doctorId);
}
