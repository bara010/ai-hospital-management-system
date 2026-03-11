package com.hospital.controller;

import com.hospital.model.VitalRecord;
import com.hospital.repository.VitalRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * VitalsController — REST API for patient vital signs tracking.
 *
 * GET  /api/vitals/patient/{patientId}         — all vitals for a patient (desc)
 * GET  /api/vitals/patient/{patientId}/recent  — last 7 entries
 * POST /api/vitals                             — log a new vital reading
 * DELETE /api/vitals/{id}                      — delete a record
 */
@RestController
@RequestMapping("/api/vitals")
@CrossOrigin(origins = "*")
public class VitalsController {

    @Autowired private VitalRecordRepository vitalsRepo;

    @GetMapping("/patient/{patientId}")
    public List<VitalRecord> getByPatient(@PathVariable Long patientId) {
        return vitalsRepo.findByPatientIdOrderByRecordedAtDesc(patientId);
    }

    @GetMapping("/patient/{patientId}/recent")
    public List<VitalRecord> getRecent(@PathVariable Long patientId) {
        return vitalsRepo.findTop7ByPatientIdOrderByRecordedAtDesc(patientId);
    }

    @PostMapping
    public ResponseEntity<?> log(@RequestBody Map<String, Object> body) {
        try {
            VitalRecord v = new VitalRecord();
            v.setPatientId(Long.parseLong(body.get("patientId").toString()));
            if (body.containsKey("systolic"))    v.setSystolic(Integer.parseInt(body.get("systolic").toString()));
            if (body.containsKey("diastolic"))   v.setDiastolic(Integer.parseInt(body.get("diastolic").toString()));
            if (body.containsKey("bloodSugar"))  v.setBloodSugar(Double.parseDouble(body.get("bloodSugar").toString()));
            if (body.containsKey("spo2"))        v.setSpo2(Integer.parseInt(body.get("spo2").toString()));
            if (body.containsKey("heartRate"))   v.setHeartRate(Integer.parseInt(body.get("heartRate").toString()));
            if (body.containsKey("temperature")) v.setTemperature(Double.parseDouble(body.get("temperature").toString()));
            if (body.containsKey("weight"))      v.setWeight(Double.parseDouble(body.get("weight").toString()));
            if (body.containsKey("notes"))       v.setNotes((String) body.get("notes"));
            if (body.containsKey("recordedAt"))  v.setRecordedAt(LocalDateTime.parse(body.get("recordedAt").toString()));
            VitalRecord saved = vitalsRepo.save(v);
            return ResponseEntity.ok(Map.of("success", true, "id", saved.getId(), "message", "Vitals logged successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to log vitals: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!vitalsRepo.existsById(id)) return ResponseEntity.notFound().build();
        vitalsRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    /** Summarise latest reading and trends for dashboard widget */
    @GetMapping("/patient/{patientId}/summary")
    public ResponseEntity<?> summary(@PathVariable Long patientId) {
        List<VitalRecord> records = vitalsRepo.findTop7ByPatientIdOrderByRecordedAtDesc(patientId);
        if (records.isEmpty()) return ResponseEntity.ok(Map.of("hasData", false));

        VitalRecord latest = records.get(0);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("hasData", true);
        m.put("latest", latest);
        m.put("count", records.size());

        // Simple trend: compare latest vs oldest of the 7
        if (records.size() >= 2) {
            VitalRecord oldest = records.get(records.size() - 1);
            if (latest.getSystolic() != null && oldest.getSystolic() != null) {
                int diff = latest.getSystolic() - oldest.getSystolic();
                m.put("bpTrend", diff > 5 ? "UP" : diff < -5 ? "DOWN" : "STABLE");
            }
            if (latest.getBloodSugar() != null && oldest.getBloodSugar() != null) {
                double diff = latest.getBloodSugar() - oldest.getBloodSugar();
                m.put("sugarTrend", diff > 10 ? "UP" : diff < -10 ? "DOWN" : "STABLE");
            }
        }
        return ResponseEntity.ok(m);
    }
}
