package com.hospital.controller;

import com.hospital.model.BedRecord;
import com.hospital.repository.BedRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * BedController — REST API for hospital bed occupancy.
 *
 * GET  /api/beds                  — all beds
 * GET  /api/beds/ward/{ward}      — beds by ward
 * GET  /api/beds/summary          — occupancy stats
 * PUT  /api/beds/{id}/assign      — assign patient to bed
 * PUT  /api/beds/{id}/discharge   — discharge / vacate bed
 * PUT  /api/beds/{id}/maintenance — mark for maintenance
 */
@RestController
@RequestMapping("/api/beds")
@CrossOrigin(origins = "*")
public class BedController {

    @Autowired private BedRecordRepository bedRepo;

    @GetMapping
    public List<BedRecord> getAll() {
        return bedRepo.findAllByOrderByWardAscBedNumberAsc();
    }

    @GetMapping("/ward/{ward}")
    public List<BedRecord> getByWard(@PathVariable String ward) {
        return bedRepo.findByWard(ward);
    }

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        Map<String, Object> s = new LinkedHashMap<>();
        long total = bedRepo.count();
        long occupied = bedRepo.countByStatus("OCCUPIED");
        long vacant = bedRepo.countByStatus("VACANT");
        long maintenance = bedRepo.countByStatus("MAINTENANCE");
        s.put("totalBeds", total);
        s.put("occupied", occupied);
        s.put("vacant", vacant);
        s.put("maintenance", maintenance);
        s.put("occupancyRate", total > 0 ? Math.round((double) occupied / total * 100) : 0);

        // Per-ward breakdown
        List<String> wards = List.of("ICU", "General", "Pediatric", "Maternity", "Emergency", "Surgical");
        Map<String, Map<String, Long>> wardStats = new LinkedHashMap<>();
        for (String ward : wards) {
            Map<String, Long> ws = new LinkedHashMap<>();
            ws.put("total", bedRepo.countByWardAndStatus(ward, "OCCUPIED") + bedRepo.countByWardAndStatus(ward, "VACANT") + bedRepo.countByWardAndStatus(ward, "MAINTENANCE"));
            ws.put("occupied", bedRepo.countByWardAndStatus(ward, "OCCUPIED"));
            ws.put("vacant", bedRepo.countByWardAndStatus(ward, "VACANT"));
            wardStats.put(ward, ws);
        }
        s.put("wards", wardStats);
        return s;
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<?> assignPatient(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return bedRepo.findById(id).map(bed -> {
            if ("OCCUPIED".equals(bed.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Bed is already occupied"));
            }
            bed.setStatus("OCCUPIED");
            bed.setPatientName((String) body.get("patientName"));
            if (body.containsKey("patientId")) bed.setPatientId(Long.parseLong(body.get("patientId").toString()));
            bed.setAdmittedFor((String) body.getOrDefault("admittedFor", "General admission"));
            bed.setAdmittedAt(LocalDateTime.now());
            bed.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(bedRepo.save(bed));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/discharge")
    public ResponseEntity<?> discharge(@PathVariable Long id) {
        return bedRepo.findById(id).map(bed -> {
            bed.setStatus("VACANT");
            bed.setPatientName(null);
            bed.setPatientId(null);
            bed.setAdmittedFor(null);
            bed.setAdmittedAt(null);
            bed.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(bedRepo.save(bed));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/maintenance")
    public ResponseEntity<?> maintenance(@PathVariable Long id) {
        return bedRepo.findById(id).map(bed -> {
            bed.setStatus("MAINTENANCE");
            bed.setPatientName(null);
            bed.setPatientId(null);
            bed.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(bedRepo.save(bed));
        }).orElse(ResponseEntity.notFound().build());
    }
}
