package com.hospital.repository;

import com.hospital.model.OnlineConsult;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OnlineConsultRepository extends JpaRepository<OnlineConsult, Long> {
    List<OnlineConsult> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    List<OnlineConsult> findByStatusOrderByCreatedAtAsc(String status);
    List<OnlineConsult> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);
    List<OnlineConsult> findAllByOrderByCreatedAtDesc();
}
