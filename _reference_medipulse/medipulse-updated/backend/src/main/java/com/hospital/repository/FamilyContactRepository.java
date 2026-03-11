package com.hospital.repository;

import com.hospital.model.FamilyContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FamilyContactRepository extends JpaRepository<FamilyContact, Long> {
    List<FamilyContact> findByPatientIdOrderByPrimaryDescIdAsc(Long patientId);
}
