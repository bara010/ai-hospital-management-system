package com.hospito.repository;

import com.hospito.entity.MedicationPlan;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MedicationPlanRepository extends JpaRepository<MedicationPlan, Long> {

    @EntityGraph(attributePaths = {"patient", "patient.user", "doctor", "doctor.user", "appointment"})
    List<MedicationPlan> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);

    @EntityGraph(attributePaths = {"patient", "patient.user", "doctor", "doctor.user", "appointment"})
    List<MedicationPlan> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    @EntityGraph(attributePaths = {"patient", "patient.user", "doctor", "doctor.user", "appointment"})
    Optional<MedicationPlan> findById(Long id);

    @EntityGraph(attributePaths = {"patient", "patient.user", "doctor", "doctor.user", "appointment"})
    List<MedicationPlan> findByActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByPatientIdAsc(
            LocalDate startDate,
            LocalDate endDate
    );
}
