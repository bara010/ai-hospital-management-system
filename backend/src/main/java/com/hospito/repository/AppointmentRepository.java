package com.hospito.repository;

import com.hospito.entity.Appointment;
import com.hospito.entity.AppointmentStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    @EntityGraph(attributePaths = {"patient", "patient.user", "doctor", "doctor.user"})
    List<Appointment> findByPatientIdOrderByStartTimeDesc(Long patientId);

    @EntityGraph(attributePaths = {"patient", "patient.user", "doctor", "doctor.user"})
    List<Appointment> findByDoctorIdOrderByStartTimeDesc(Long doctorId);

    @EntityGraph(attributePaths = {"patient", "patient.user", "doctor", "doctor.user"})
    List<Appointment> findAllByOrderByStartTimeDesc();

    boolean existsByDoctorIdAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
            Long doctorId,
            Collection<AppointmentStatus> status,
            LocalDateTime endTime,
            LocalDateTime startTime
    );

    boolean existsByDoctorIdAndPatientId(Long doctorId, Long patientId);

    List<Appointment> findByDoctorIdAndStatusInAndStartTimeBetween(
            Long doctorId,
            Collection<AppointmentStatus> statuses,
            LocalDateTime dayStart,
            LocalDateTime dayEnd
    );

    List<Appointment> findByStatusAndStartTimeBetweenAndReminderSentFalse(
            AppointmentStatus status,
            LocalDateTime from,
            LocalDateTime to
    );

    @EntityGraph(attributePaths = {"patient", "patient.user", "doctor", "doctor.user"})
    List<Appointment> findByStatusAndStartTimeBetweenOrderByStartTimeAsc(
            AppointmentStatus status,
            LocalDateTime from,
            LocalDateTime to
    );

    @EntityGraph(attributePaths = {"patient", "patient.user", "doctor", "doctor.user"})
    Optional<Appointment> findById(Long id);
}
