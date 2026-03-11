package com.hospital.controller;

import com.hospital.model.Invoice;
import com.hospital.repository.InvoiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * InvoiceController — REST API for billing and invoice management.
 *
 * GET  /api/invoices               — all invoices
 * GET  /api/invoices/{id}          — single invoice
 * GET  /api/invoices/status/{s}    — filter by status
 * GET  /api/invoices/summary       — revenue analytics summary
 * POST /api/invoices               — create invoice
 * PUT  /api/invoices/{id}/status   — update payment status
 * DELETE /api/invoices/{id}        — delete invoice
 */
@RestController
@RequestMapping("/api/invoices")
@CrossOrigin(origins = "*")
public class InvoiceController {

    @Autowired private InvoiceRepository invoiceRepo;

    @GetMapping
    public List<Invoice> getAll() {
        return invoiceRepo.findAllByOrderByInvoiceDateDesc();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Invoice> getById(@PathVariable Long id) {
        return invoiceRepo.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    public List<Invoice> getByStatus(@PathVariable String status) {
        return invoiceRepo.findByStatus(status.toUpperCase());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        try {
            Invoice inv = new Invoice();

            // Auto-generate invoice number if not provided
            String invNo = body.containsKey("invoiceNumber")
                ? body.get("invoiceNumber").toString()
                : "INV-" + System.currentTimeMillis() % 1000000;

            // Ensure unique invoice number
            while (invoiceRepo.existsByInvoiceNumber(invNo)) {
                invNo = "INV-" + (System.currentTimeMillis() % 1000000);
            }

            inv.setInvoiceNumber(invNo);
            inv.setPatientName((String) body.get("patientName"));
            inv.setPatientIdCode((String) body.getOrDefault("patientIdCode", "PT-" + (int)(Math.random() * 9000 + 1000)));
            inv.setDoctorName((String) body.getOrDefault("doctorName", "Dr. Unknown"));
            inv.setItemsJson(body.containsKey("itemsJson") ? body.get("itemsJson").toString() : "[]");

            double subtotal = body.containsKey("subtotal") ? Double.parseDouble(body.get("subtotal").toString()) : 0;
            double tax      = body.containsKey("tax")      ? Double.parseDouble(body.get("tax").toString())      : Math.round(subtotal * 0.05);
            inv.setSubtotal(subtotal);
            inv.setTax(tax);
            inv.setTotal(subtotal + tax);
            inv.setStatus(body.getOrDefault("status", "PENDING").toString().toUpperCase());
            inv.setInvoiceDate(LocalDateTime.now());

            Invoice saved = invoiceRepo.save(inv);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "id", saved.getId(),
                "invoiceNumber", saved.getInvoiceNumber()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return invoiceRepo.findById(id).map(inv -> {
            inv.setStatus(body.getOrDefault("status", inv.getStatus()).toUpperCase());
            invoiceRepo.save(inv);
            return ResponseEntity.ok(Map.of("success", true, "status", inv.getStatus()));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!invoiceRepo.existsById(id)) return ResponseEntity.notFound().build();
        invoiceRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    /** Revenue analytics summary */
    @GetMapping("/summary")
    public Map<String, Object> summary() {
        Map<String, Object> s = new LinkedHashMap<>();
        long total = invoiceRepo.count();
        Double paid    = invoiceRepo.sumPaidInvoices();
        Double pending = invoiceRepo.sumPendingInvoices();
        Double overdue = invoiceRepo.sumOverdueInvoices();
        double totalRev = (paid != null ? paid : 0) + (pending != null ? pending : 0) + (overdue != null ? overdue : 0);

        s.put("totalInvoices", total);
        s.put("totalRevenue", totalRev);
        s.put("paidAmount",   paid    != null ? paid    : 0);
        s.put("pendingAmount", pending != null ? pending : 0);
        s.put("overdueAmount", overdue != null ? overdue : 0);
        s.put("paidCount",   invoiceRepo.findByStatus("PAID").size());
        s.put("pendingCount", invoiceRepo.findByStatus("PENDING").size());
        s.put("overdueCount", invoiceRepo.findByStatus("OVERDUE").size());
        s.put("collectionRate", totalRev > 0 ? Math.round((paid != null ? paid : 0) / totalRev * 100) : 0);
        return s;
    }
}
