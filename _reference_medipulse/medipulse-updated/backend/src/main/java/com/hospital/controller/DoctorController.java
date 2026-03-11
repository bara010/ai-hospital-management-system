package com.hospital.controller;

import com.hospital.model.Doctor;
import com.hospital.repository.AppointmentRepository;
import com.hospital.repository.DoctorRepository;
import com.hospital.repository.PatientRepository;
import com.hospital.repository.UserRepository;
import com.hospital.service.SymptomAnalysisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * DoctorController — REST API for doctor management.
 *
 * GET  /api/doctors                             — list all doctors
 * GET  /api/doctors/{id}                        — get doctor by id
 * GET  /api/doctors/department/{dept}           — filter by department
 * GET  /api/doctors/recommended/{patientId}     — smart department-matched doctors for patient
 * GET  /api/doctors/for-user/{userId}           — get doctor profile by user id
 * POST /api/doctors                             — create doctor profile
 * PUT  /api/doctors/{id}                        — update doctor info
 * GET  /api/doctors/{id}/stats                  — doctor KPI stats
 * GET  /api/doctors/{id}/patients               — patients assigned/booked with this doctor
 */
@RestController
@RequestMapping("/api/doctors")
@CrossOrigin(origins = "*")
public class DoctorController {

    @Autowired private DoctorRepository doctorRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private AppointmentRepository appointmentRepo;
    @Autowired private PatientRepository patientRepo;

    @GetMapping
    public List<Map<String, Object>> getAll() {
        return enrichDoctors(doctorRepo.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return doctorRepo.findById(id)
            .map(d -> ResponseEntity.ok(enrichDoctor(d)))
            .orElse(ResponseEntity.notFound().build());
    }

    /** Get doctor profile by their user ID (for doctor's own dashboard) */
    @GetMapping("/for-user/{userId}")
    public ResponseEntity<?> getByUserId(@PathVariable Long userId) {
        return doctorRepo.findByUser_Id(userId)
            .map(d -> ResponseEntity.ok(enrichDoctor(d)))
            .orElse(ResponseEntity.notFound().build());
    }

    /** Filter doctors by department code (e.g. CARDIOLOGY, ENT, OPHTHALMOLOGY) */
    @GetMapping("/department/{dept}")
    public List<Map<String, Object>> getByDepartment(@PathVariable String dept) {
        return enrichDoctors(doctorRepo.findByDepartment(dept.toUpperCase()));
    }

    /**
     * NEW: Smart doctor recommendation — returns doctors matching the patient's
     * suggestedDepartment (set by SymptomAnalysisService).
     * Falls back to GENERAL_MEDICINE if no match.
     *
     * GET /api/doctors/recommended/{patientId}
     */
    @GetMapping("/recommended/{patientId}")
    public ResponseEntity<?> getRecommended(@PathVariable Long patientId) {
        return patientRepo.findById(patientId).map(p -> {
            String dept = p.getSuggestedDepartment();
            if (dept == null || dept.isBlank()) dept = "GENERAL_MEDICINE";

            List<Doctor> doctors = doctorRepo.findByDepartment(dept);
            if (doctors.isEmpty()) {
                // Fallback: try GENERAL_MEDICINE
                doctors = doctorRepo.findByDepartment("GENERAL_MEDICINE");
            }

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("suggestedDepartment", dept);
            response.put("departmentLabel", SymptomAnalysisService.deptLabel(dept));
            response.put("predictedCondition", p.getPredictedCondition());
            response.put("emergencyLevel", p.getEmergencyLevel());
            response.put("severityScore", p.getSeverityScore());
            response.put("doctors", enrichDoctors(doctors));
            return ResponseEntity.ok(response);
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * NEW: Get patients who have appointments with this doctor.
     * Doctors see ONLY their own patients — not all patients.
     *
     * GET /api/doctors/{id}/patients
     */
    @GetMapping("/{id}/patients")
    public ResponseEntity<?> getDoctorPatients(@PathVariable Long id) {
        if (!doctorRepo.existsById(id)) return ResponseEntity.notFound().build();

        var appointments = appointmentRepo.findByDoctorId(id);
        Set<Long> seen = new HashSet<>();
        List<Map<String, Object>> patients = new ArrayList<>();

        for (var appt : appointments) {
            if (appt.getPatient() == null) continue;
            Long pid = appt.getPatient().getId();
            if (seen.contains(pid)) continue;
            seen.add(pid);

            var pt = appt.getPatient();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("patientId", pid);
            m.put("name", pt.getUser() != null ? pt.getUser().getName() : "Unknown");
            m.put("age", pt.getAge());
            m.put("gender", pt.getGender());
            m.put("bloodGroup", pt.getBloodGroup());
            m.put("symptoms", pt.getSymptoms());
            m.put("predictedCondition", pt.getPredictedCondition());
            m.put("emergencyLevel", pt.getEmergencyLevel());
            m.put("severityScore", pt.getSeverityScore());
            m.put("status", pt.getStatus());
            m.put("lastAppointment", appt.getAppointmentDate());
            patients.add(m);
        }

        return ResponseEntity.ok(Map.of("doctorId", id, "patients", patients, "total", patients.size()));
    }

    /** KPI stats for a specific doctor */
    @GetMapping("/{id}/stats")
    public ResponseEntity<?> stats(@PathVariable Long id) {
        return doctorRepo.findById(id).map(d -> {
            var appts = appointmentRepo.findByDoctorId(id);
            long total     = appts.size();
            long completed = appts.stream().filter(a -> "COMPLETED".equals(a.getStatus())).count();
            long cancelled = appts.stream().filter(a -> "CANCELLED".equals(a.getStatus())).count();
            long noShow    = appts.stream().filter(a -> "NO_SHOW".equals(a.getStatus())).count();
            double completionRate = total > 0 ? (double) completed / total * 100 : 0;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("totalAppointments", total);
            m.put("completed", completed);
            m.put("cancelled", cancelled);
            m.put("noShow", noShow);
            m.put("completionRate", Math.round(completionRate));
            return ResponseEntity.ok(m);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        try {
            Doctor d = new Doctor();
            if (body.containsKey("userId")) {
                userRepo.findById(Long.parseLong(body.get("userId").toString())).ifPresent(d::setUser);
            }
            applyFields(d, body);
            return ResponseEntity.ok(enrichDoctor(doctorRepo.save(d)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return doctorRepo.findById(id).map(d -> {
            applyFields(d, body);
            return ResponseEntity.ok(enrichDoctor(doctorRepo.save(d)));
        }).orElse(ResponseEntity.notFound().build());
    }

    private void applyFields(Doctor d, Map<String, Object> body) {
        if (body.containsKey("specialization"))  d.setSpecialization((String) body.get("specialization"));
        if (body.containsKey("department"))       d.setDepartment(((String) body.get("department")).toUpperCase());
        if (body.containsKey("qualification"))    d.setQualification((String) body.get("qualification"));
        if (body.containsKey("availability"))     d.setAvailability((String) body.get("availability"));
        if (body.containsKey("consultationFee"))  d.setConsultationFee(Double.parseDouble(body.get("consultationFee").toString()));
    }

    private Map<String, Object> enrichDoctor(Doctor d) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", d.getId());
        m.put("specialization", d.getSpecialization());
        m.put("department", d.getDepartment());
        m.put("departmentLabel", SymptomAnalysisService.deptLabel(d.getDepartment()));
        m.put("qualification", d.getQualification());
        m.put("availability", d.getAvailability());
        m.put("consultationFee", d.getConsultationFee());
        if (d.getUser() != null) {
            m.put("name", d.getUser().getName());
            m.put("email", d.getUser().getEmail());
            m.put("phone", d.getUser().getPhone());
            m.put("userId", d.getUser().getId());
        }
        return m;
    }

    private List<Map<String, Object>> enrichDoctors(List<Doctor> doctors) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Doctor d : doctors) result.add(enrichDoctor(d));
        return result;
    }
}
