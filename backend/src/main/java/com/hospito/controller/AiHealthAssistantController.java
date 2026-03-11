package com.hospito.controller;

import com.hospito.dto.AiSymptomRequest;
import com.hospito.dto.AiSymptomResponse;
import com.hospito.dto.MedicineInfoResponse;
import com.hospito.service.AiHealthAssistantService;
import com.hospito.service.MedicineInfoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@PreAuthorize("hasRole('PATIENT')")
public class AiHealthAssistantController {

    private final AiHealthAssistantService aiHealthAssistantService;
    private final MedicineInfoService medicineInfoService;

    public AiHealthAssistantController(
            AiHealthAssistantService aiHealthAssistantService,
            MedicineInfoService medicineInfoService
    ) {
        this.aiHealthAssistantService = aiHealthAssistantService;
        this.medicineInfoService = medicineInfoService;
    }

    @PostMapping("/symptom-checker")
    public ResponseEntity<AiSymptomResponse> symptomChecker(@Valid @RequestBody AiSymptomRequest request) {
        return ResponseEntity.ok(aiHealthAssistantService.analyzeSymptoms(request));
    }

    @GetMapping("/medicine-info")
    public ResponseEntity<MedicineInfoResponse> medicineInfo(@RequestParam("name") String name) {
        return ResponseEntity.ok(medicineInfoService.lookup(name));
    }
}
