package com.hospital.repository;

import com.hospital.model.PharmacyItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PharmacyItemRepository extends JpaRepository<PharmacyItem, Long> {
    List<PharmacyItem> findAllByOrderByNameAsc();
    List<PharmacyItem> findByStockStatus(String status);
    List<PharmacyItem> findByCategory(String category);
    List<PharmacyItem> findByStockLessThanEqual(int threshold);
}
