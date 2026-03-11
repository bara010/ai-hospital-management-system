package com.hospito.repository;

import com.hospito.entity.DoctorRating;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DoctorRatingRepository extends JpaRepository<DoctorRating, Long> {
    List<DoctorRating> findByDoctorId(Long doctorId);

    Optional<DoctorRating> findByAppointmentIdAndPatientId(Long appointmentId, Long patientId);
}
