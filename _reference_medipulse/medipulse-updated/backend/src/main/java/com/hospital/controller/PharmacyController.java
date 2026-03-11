package com.hospital.controller;

import com.hospital.model.PharmacyItem;
import com.hospital.repository.PharmacyItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * PharmacyController — REST API for pharmacy inventory.
 *
 * GET  /api/pharmacy                  — all items
 * GET  /api/pharmacy/{id}             — single item
 * GET  /api/pharmacy/alerts           — items below min stock
 * GET  /api/pharmacy/summary          — inventory summary stats
 * POST /api/pharmacy                  — add new item
 * PUT  /api/pharmacy/{id}             — update item
 * PUT  /api/pharmacy/{id}/restock     — update stock quantity
 * DELETE /api/pharmacy/{id}           — delete item
 */
@RestController
@RequestMapping("/api/pharmacy")
@CrossOrigin(origins = "*")
public class PharmacyController {

    @Autowired private PharmacyItemRepository pharmacyRepo;

    @GetMapping
    public List<PharmacyItem> getAll() {
        return pharmacyRepo.findAllByOrderByNameAsc();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PharmacyItem> getById(@PathVariable Long id) {
        return pharmacyRepo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/alerts")
    public List<PharmacyItem> getAlerts() {
        // Items where stock <= minStock
        List<PharmacyItem> all = pharmacyRepo.findAllByOrderByNameAsc();
        List<PharmacyItem> alerts = new ArrayList<>();
        for (PharmacyItem item : all) {
            if (item.getStock() <= item.getMinStock()) alerts.add(item);
        }
        return alerts;
    }

    @GetMapping("/category/{category}")
    public List<PharmacyItem> getByCategory(@PathVariable String category) {
        return pharmacyRepo.findByCategory(category);
    }

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        List<PharmacyItem> all = pharmacyRepo.findAllByOrderByNameAsc();
        long low = all.stream().filter(i -> "LOW".equals(i.getStockStatus())).count();
        long critical = all.stream().filter(i -> "CRITICAL".equals(i.getStockStatus())).count();
        double totalValue = all.stream().mapToDouble(i -> i.getStock() * i.getUnitPrice()).sum();
        LocalDate today = LocalDate.now();
        long expiringSoon = all.stream()
            .filter(i -> i.getExpiryDate() != null && !i.getExpiryDate().isBefore(today)
                && i.getExpiryDate().isBefore(today.plusDays(30)))
            .count();
        return Map.of(
            "totalItems", all.size(),
            "lowStock", low,
            "criticalStock", critical,
            "totalInventoryValue", Math.round(totalValue),
            "expiringSoon", expiringSoon
        );
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        try {
            PharmacyItem item = new PharmacyItem();
            applyFields(item, body);
            updateStockStatus(item);
            return ResponseEntity.ok(pharmacyRepo.save(item));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return pharmacyRepo.findById(id).map(item -> {
            applyFields(item, body);
            updateStockStatus(item);
            return ResponseEntity.ok(pharmacyRepo.save(item));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/restock")
    public ResponseEntity<?> restock(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return pharmacyRepo.findById(id).map(item -> {
            int qty = Integer.parseInt(body.get("quantity").toString());
            item.setStock(item.getStock() + qty);
            item.setLastRestocked(LocalDateTime.now());
            updateStockStatus(item);
            pharmacyRepo.save(item);
            return ResponseEntity.ok(Map.of("success", true, "newStock", item.getStock(), "status", item.getStockStatus()));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!pharmacyRepo.existsById(id)) return ResponseEntity.notFound().build();
        pharmacyRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void applyFields(PharmacyItem item, Map<String, Object> body) {
        if (body.containsKey("name"))      item.setName((String) body.get("name"));
        if (body.containsKey("category"))  item.setCategory((String) body.get("category"));
        if (body.containsKey("supplier"))  item.setSupplier((String) body.get("supplier"));
        if (body.containsKey("stock"))     item.setStock(Integer.parseInt(body.get("stock").toString()));
        if (body.containsKey("minStock"))  item.setMinStock(Integer.parseInt(body.get("minStock").toString()));
        if (body.containsKey("unitPrice")) item.setUnitPrice(Double.parseDouble(body.get("unitPrice").toString()));
        if (body.containsKey("unit"))      item.setUnit((String) body.get("unit"));
        if (body.containsKey("expiryDate")) item.setExpiryDate(LocalDate.parse(body.get("expiryDate").toString()));
    }

    private void updateStockStatus(PharmacyItem item) {
        if (item.getStock() == 0) {
            item.setStockStatus("CRITICAL");
        } else if (item.getStock() <= item.getMinStock()) {
            item.setStockStatus("LOW");
        } else {
            item.setStockStatus("OK");
        }
    }
}
