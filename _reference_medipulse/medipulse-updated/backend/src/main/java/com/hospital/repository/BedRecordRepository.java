package com.hospital.repository;

import com.hospital.model.BedRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BedRecordRepository extends JpaRepository<BedRecord, Long> {
    List<BedRecord> findAllByOrderByWardAscBedNumberAsc();
    List<BedRecord> findByWard(String ward);
    List<BedRecord> findByStatus(String status);
    long countByStatus(String status);
    long countByWardAndStatus(String ward, String status);
}
