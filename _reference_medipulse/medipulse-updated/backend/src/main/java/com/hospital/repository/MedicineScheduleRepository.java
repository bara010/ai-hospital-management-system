package com.hospital.repository;

import com.hospital.model.MedicineSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicineScheduleRepository extends JpaRepository<MedicineSchedule, Long> {
    List<MedicineSchedule> findByActiveTrue();
    List<MedicineSchedule> findByPatientId(Long patientId);
    List<MedicineSchedule> findByReminderHourAndReminderMinuteAndActiveTrue(int hour, int minute);
}
