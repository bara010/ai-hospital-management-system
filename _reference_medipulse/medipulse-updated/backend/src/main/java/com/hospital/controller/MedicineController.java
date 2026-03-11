package com.hospital.controller;

import com.hospital.model.MedicineSchedule;
import com.hospital.repository.MedicineScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * MedicineController — REST API for medicine reminders / schedules.
 *
 * GET  /api/medicines/patient/{id}  — get schedules for patient
 * POST /api/medicines               — add new schedule
 * PUT  /api/medicines/{id}          — update schedule
 * PUT  /api/medicines/{id}/toggle   — activate / deactivate
 * DELETE /api/medicines/{id}        — delete schedule
 */
@RestController
@RequestMapping("/api/medicines")
@CrossOrigin(origins = "*")
public class MedicineController {

    @Autowired private MedicineScheduleRepository medRepo;

    @GetMapping("/patient/{patientId}")
    public List<MedicineSchedule> getByPatient(@PathVariable Long patientId) {
        return medRepo.findByPatientId(patientId);
    }

    @GetMapping("/active")
    public List<MedicineSchedule> getActive() {
        return medRepo.findByActiveTrue();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        try {
            MedicineSchedule s = new MedicineSchedule();
            s.setPatientId(Long.parseLong(body.get("patientId").toString()));
            s.setPatientName((String) body.get("patientName"));
            s.setMedicineName((String) body.get("medicineName"));
            s.setDose((String) body.getOrDefault("dose", ""));
            s.setReminderHour(Integer.parseInt(body.get("reminderHour").toString()));
            s.setReminderMinute(Integer.parseInt(body.getOrDefault("reminderMinute", "0").toString()));
            s.setTimeOfDay((String) body.getOrDefault("timeOfDay", "morning"));
            s.setActive(true);
            MedicineSchedule saved = medRepo.save(s);
            return ResponseEntity.ok(Map.of("success", true, "id", saved.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return medRepo.findById(id).map(s -> {
            if (body.containsKey("medicineName")) s.setMedicineName((String) body.get("medicineName"));
            if (body.containsKey("dose")) s.setDose((String) body.get("dose"));
            if (body.containsKey("reminderHour")) s.setReminderHour(Integer.parseInt(body.get("reminderHour").toString()));
            if (body.containsKey("reminderMinute")) s.setReminderMinute(Integer.parseInt(body.get("reminderMinute").toString()));
            if (body.containsKey("timeOfDay")) s.setTimeOfDay((String) body.get("timeOfDay"));
            return ResponseEntity.ok(medRepo.save(s));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<?> toggle(@PathVariable Long id) {
        return medRepo.findById(id).map(s -> {
            s.setActive(!s.isActive());
            medRepo.save(s);
            return ResponseEntity.ok(Map.of("success", true, "active", s.isActive()));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!medRepo.existsById(id)) return ResponseEntity.notFound().build();
        medRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
