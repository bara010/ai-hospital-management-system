package com.hospital.controller;
import com.hospital.model.DischargeSummaryRecord;
import com.hospital.repository.DischargeSummaryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController @RequestMapping("/api/discharge") @CrossOrigin(origins="http://localhost:3000")
public class DischargeSummaryController {
    @Autowired private DischargeSummaryRepository repo;

    @GetMapping public List<DischargeSummaryRecord> getAll(){return repo.findAllByOrderByCreatedAtDesc();}
    @GetMapping("/patient/{id}") public List<DischargeSummaryRecord> getByPatient(@PathVariable Long id){
        return repo.findByPatientIdOrderByCreatedAtDesc(id);
    }
    @PostMapping public ResponseEntity<?> save(@RequestBody Map<String,Object> b) {
        try {
            DischargeSummaryRecord r=new DischargeSummaryRecord();
            if(b.containsKey("patientId")) r.setPatientId(Long.parseLong(b.get("patientId").toString()));
            r.setPatientName((String)b.getOrDefault("patientName",""));
            r.setAge((String)b.getOrDefault("age",""));
            r.setGender((String)b.getOrDefault("gender",""));
            r.setAdmissionDate((String)b.getOrDefault("admissionDate",""));
            r.setDischargeDate((String)b.getOrDefault("dischargeDate",""));
            r.setAdmissionDiagnosis((String)b.getOrDefault("admissionDiagnosis",""));
            r.setFinalDiagnosis((String)b.getOrDefault("finalDiagnosis",""));
            r.setTreatmentGiven((String)b.getOrDefault("treatmentGiven",""));
            r.setMedicationsOnDischarge((String)b.getOrDefault("medicationsOnDischarge",""));
            r.setDoctorName((String)b.getOrDefault("doctorName",""));
            r.setFollowUpDate((String)b.getOrDefault("followUpDate",""));
            r.setSpecialInstructions((String)b.getOrDefault("specialInstructions",""));
            r.setSummaryText((String)b.getOrDefault("summaryText",""));
            return ResponseEntity.ok(Map.of("success",true,"id",repo.save(r).getId()));
        } catch(Exception e){return ResponseEntity.badRequest().body(Map.of("error",e.getMessage()));}
    }
}
