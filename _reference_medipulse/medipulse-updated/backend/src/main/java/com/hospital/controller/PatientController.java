package com.hospital.controller;

import com.hospital.model.HealthHistory;
import com.hospital.model.Patient;
import com.hospital.model.User;
import com.hospital.repository.HealthHistoryRepository;
import com.hospital.repository.PatientRepository;
import com.hospital.repository.UserRepository;
import com.hospital.service.SymptomAnalysisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * PatientController — REST API for patient management.
 *
 * GET  /api/patients                       — list all patients (Admin/Doctor)
 * GET  /api/patients/{id}                  — get patient by id
 * GET  /api/patients/user/{userId}         — get patient profile by user id
 * POST /api/patients                       — create/register patient profile
 * PUT  /api/patients/{id}                  — update patient info
 * PUT  /api/patients/{id}/status           — update admission status
 * GET  /api/patients/status/{status}       — filter by status
 *
 * — NEW —
 * POST /api/patients/{id}/analyze          — run symptom analysis & save result
 * GET  /api/patients/{id}/analysis         — get latest analysis result
 * GET  /api/patients/{id}/history          — get health history (trends)
 * GET  /api/patients/department/{dept}     — filter patients by suggested dept
 */
@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "*")
public class PatientController {

    @Autowired private PatientRepository patientRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private HealthHistoryRepository healthHistoryRepo;
    @Autowired private SymptomAnalysisService analysisService;

    @GetMapping
    public List<Map<String, Object>> getAll() {
        // Only return patients whose linked user has PATIENT role
        return enrichPatients(patientRepo.findAll().stream()
            .filter(p -> p.getUser() == null || "PATIENT".equalsIgnoreCase(p.getUser().getRole()))
            .toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return patientRepo.findById(id)
            .map(p -> ResponseEntity.ok(enrichPatient(p)))
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getByUserId(@PathVariable Long userId) {
        return patientRepo.findByUser_Id(userId)
            .map(p -> ResponseEntity.ok(enrichPatient(p)))
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    public List<Map<String, Object>> getByStatus(@PathVariable String status) {
        return enrichPatients(patientRepo.findByStatus(status.toUpperCase()).stream()
            .filter(p -> p.getUser() == null || "PATIENT".equalsIgnoreCase(p.getUser().getRole()))
            .toList());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        try {
            Patient p = new Patient();
            applyFields(p, body);
            if (body.containsKey("userId")) {
                Long uid = Long.parseLong(body.get("userId").toString());
                userRepo.findById(uid).ifPresent(p::setUser);
            }
            // Auto-analyze if symptoms provided
            if (body.containsKey("symptoms") && body.get("symptoms") != null) {
                runAnalysis(p);
            }
            return ResponseEntity.ok(enrichPatient(patientRepo.save(p)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return patientRepo.findById(id).map(p -> {
            applyFields(p, body);
            // Re-analyze if symptoms updated
            if (body.containsKey("symptoms") && p.getSymptoms() != null) {
                runAnalysis(p);
                saveHistory(p);
            }
            return ResponseEntity.ok(enrichPatient(patientRepo.save(p)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return patientRepo.findById(id).map(p -> {
            p.setStatus(body.getOrDefault("status", p.getStatus()));
            return ResponseEntity.ok(Map.of("success", true, "status", patientRepo.save(p).getStatus()));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * NEW: Trigger smart symptom analysis for a patient.
     * POST /api/patients/{id}/analyze
     * Body: { symptoms, symptomDuration, existingDiseases, weightKg, emergencyLevel }
     */
    @PostMapping("/{id}/analyze")
    public ResponseEntity<?> analyze(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return patientRepo.findById(id).map(p -> {
            // Update health inputs
            if (body.containsKey("symptoms"))         p.setSymptoms((String) body.get("symptoms"));
            if (body.containsKey("symptomDuration"))  p.setSymptomDuration((String) body.get("symptomDuration"));
            if (body.containsKey("existingDiseases")) p.setExistingDiseases((String) body.get("existingDiseases"));
            if (body.containsKey("weightKg"))         p.setWeightKg(Double.parseDouble(body.get("weightKg").toString()));
            if (body.containsKey("emergencyLevel"))   p.setEmergencyLevel((String) body.get("emergencyLevel"));

            // Run analysis
            runAnalysis(p);
            patientRepo.save(p);

            // Save to health history for trend tracking
            saveHistory(p);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("predictedCondition", p.getPredictedCondition());
            result.put("suggestedDepartment", p.getSuggestedDepartment());
            result.put("departmentLabel", SymptomAnalysisService.deptLabel(p.getSuggestedDepartment()));
            result.put("severityScore", p.getSeverityScore());
            result.put("emergencyLevel", p.getEmergencyLevel());
            result.put("lastAnalyzedAt", p.getLastAnalyzedAt());
            return ResponseEntity.ok(result);
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * NEW: Get latest analysis result for a patient.
     * GET /api/patients/{id}/analysis
     */
    @GetMapping("/{id}/analysis")
    public ResponseEntity<?> getAnalysis(@PathVariable Long id) {
        return patientRepo.findById(id).map(p -> {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("predictedCondition", p.getPredictedCondition());
            r.put("suggestedDepartment", p.getSuggestedDepartment());
            r.put("departmentLabel", SymptomAnalysisService.deptLabel(p.getSuggestedDepartment()));
            r.put("severityScore", p.getSeverityScore());
            r.put("emergencyLevel", p.getEmergencyLevel());
            r.put("symptoms", p.getSymptoms());
            r.put("symptomDuration", p.getSymptomDuration());
            r.put("existingDiseases", p.getExistingDiseases());
            r.put("lastAnalyzedAt", p.getLastAnalyzedAt());
            return ResponseEntity.ok(r);
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * NEW: Get full health history (trends) for a patient.
     * GET /api/patients/{id}/history
     */
    @GetMapping("/{id}/history")
    public ResponseEntity<?> getHistory(@PathVariable Long id) {
        List<HealthHistory> history = healthHistoryRepo.findTop10ByPatientIdOrderByRecordedAtDesc(id);
        List<Map<String, Object>> result = new ArrayList<>();
        for (HealthHistory h : history) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", h.getId());
            m.put("symptoms", h.getSymptoms());
            m.put("symptomDuration", h.getSymptomDuration());
            m.put("predictedCondition", h.getPredictedCondition());
            m.put("suggestedDepartment", h.getSuggestedDepartment());
            m.put("departmentLabel", SymptomAnalysisService.deptLabel(h.getSuggestedDepartment()));
            m.put("severityScore", h.getSeverityScore());
            m.put("emergencyLevel", h.getEmergencyLevel());
            m.put("recordedAt", h.getRecordedAt());
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("total", patientRepo.count());
        s.put("outpatient", patientRepo.findByStatus("OUTPATIENT").size());
        s.put("admitted", patientRepo.findByStatus("ADMITTED").size());
        s.put("discharged", patientRepo.findByStatus("DISCHARGED").size());
        return s;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void applyFields(Patient p, Map<String, Object> body) {
        if (body.containsKey("age"))              p.setAge(Integer.parseInt(body.get("age").toString()));
        if (body.containsKey("gender"))           p.setGender((String) body.get("gender"));
        if (body.containsKey("address"))          p.setAddress((String) body.get("address"));
        if (body.containsKey("bloodGroup"))       p.setBloodGroup((String) body.get("bloodGroup"));
        if (body.containsKey("medicalHistory"))   p.setMedicalHistory((String) body.get("medicalHistory"));
        if (body.containsKey("hasChronic"))       p.setHasChronic(Boolean.parseBoolean(body.get("hasChronic").toString()));
        if (body.containsKey("prevAdmissions"))   p.setPrevAdmissions(Integer.parseInt(body.get("prevAdmissions").toString()));
        if (body.containsKey("distanceKm"))       p.setDistanceKm(Double.parseDouble(body.get("distanceKm").toString()));
        if (body.containsKey("status"))           p.setStatus((String) body.get("status"));
        // New fields
        if (body.containsKey("weightKg"))         p.setWeightKg(Double.parseDouble(body.get("weightKg").toString()));
        if (body.containsKey("symptoms"))         p.setSymptoms((String) body.get("symptoms"));
        if (body.containsKey("symptomDuration"))  p.setSymptomDuration((String) body.get("symptomDuration"));
        if (body.containsKey("existingDiseases")) p.setExistingDiseases((String) body.get("existingDiseases"));
        if (body.containsKey("emergencyLevel"))   p.setEmergencyLevel((String) body.get("emergencyLevel"));
    }

    private void runAnalysis(Patient p) {
        SymptomAnalysisService.AnalysisResult r = analysisService.analyze(
            p.getSymptoms(), p.getAge(), p.getWeightKg(), p.getExistingDiseases()
        );
        p.setPredictedCondition(r.predictedCondition());
        p.setSuggestedDepartment(r.department());
        p.setSeverityScore(r.severityScore());
        p.setEmergencyLevel(r.emergencyLevel());
        p.setLastAnalyzedAt(LocalDateTime.now());
    }

    private void saveHistory(Patient p) {
        HealthHistory h = new HealthHistory();
        h.setPatient(p);
        h.setSymptoms(p.getSymptoms());
        h.setSymptomDuration(p.getSymptomDuration());
        h.setExistingDiseases(p.getExistingDiseases());
        h.setEmergencyLevel(p.getEmergencyLevel());
        h.setWeightKg(p.getWeightKg());
        h.setPredictedCondition(p.getPredictedCondition());
        h.setSuggestedDepartment(p.getSuggestedDepartment());
        h.setSeverityScore(p.getSeverityScore());
        healthHistoryRepo.save(h);
    }

    private Map<String, Object> enrichPatient(Patient p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("age", p.getAge());
        m.put("gender", p.getGender());
        m.put("address", p.getAddress());
        m.put("bloodGroup", p.getBloodGroup());
        m.put("medicalHistory", p.getMedicalHistory());
        m.put("hasChronic", p.isHasChronic());
        m.put("prevAdmissions", p.getPrevAdmissions());
        m.put("noShowCount", p.getNoShowCount());
        m.put("distanceKm", p.getDistanceKm());
        m.put("status", p.getStatus());
        m.put("createdAt", p.getCreatedAt());
        // New fields
        m.put("weightKg", p.getWeightKg());
        m.put("symptoms", p.getSymptoms());
        m.put("symptomDuration", p.getSymptomDuration());
        m.put("existingDiseases", p.getExistingDiseases());
        m.put("emergencyLevel", p.getEmergencyLevel());
        m.put("predictedCondition", p.getPredictedCondition());
        m.put("suggestedDepartment", p.getSuggestedDepartment());
        m.put("departmentLabel", SymptomAnalysisService.deptLabel(p.getSuggestedDepartment()));
        m.put("severityScore", p.getSeverityScore());
        m.put("lastAnalyzedAt", p.getLastAnalyzedAt());
        if (p.getUser() != null) {
            m.put("name", p.getUser().getName());
            m.put("email", p.getUser().getEmail());
            m.put("phone", p.getUser().getPhone());
            m.put("userId", p.getUser().getId());
        }
        return m;
    }

    private List<Map<String, Object>> enrichPatients(List<Patient> patients) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Patient p : patients) result.add(enrichPatient(p));
        return result;
    }
}
