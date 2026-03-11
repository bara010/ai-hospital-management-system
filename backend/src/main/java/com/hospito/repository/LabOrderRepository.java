package com.hospito.repository;

import com.hospito.entity.LabOrder;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LabOrderRepository extends JpaRepository<LabOrder, Long> {

    @EntityGraph(attributePaths = {"patient", "patient.user", "doctor", "doctor.user", "appointment"})
    List<LabOrder> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);

    @EntityGraph(attributePaths = {"patient", "patient.user", "doctor", "doctor.user", "appointment"})
    List<LabOrder> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    @EntityGraph(attributePaths = {"patient", "patient.user", "doctor", "doctor.user", "appointment"})
    List<LabOrder> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"patient", "patient.user", "doctor", "doctor.user", "appointment"})
    Optional<LabOrder> findById(Long id);
}
