package com.hospital.repository;

import com.hospital.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findAllByOrderByInvoiceDateDesc();
    List<Invoice> findByStatus(String status);
    List<Invoice> findByPatientNameContainingIgnoreCase(String name);
    boolean existsByInvoiceNumber(String invoiceNumber);

    @Query("SELECT COALESCE(SUM(i.total), 0) FROM Invoice i WHERE i.status = 'PAID'")
    Double sumPaidInvoices();

    @Query("SELECT COALESCE(SUM(i.total), 0) FROM Invoice i WHERE i.status = 'PENDING'")
    Double sumPendingInvoices();

    @Query("SELECT COALESCE(SUM(i.total), 0) FROM Invoice i WHERE i.status = 'OVERDUE'")
    Double sumOverdueInvoices();
}
