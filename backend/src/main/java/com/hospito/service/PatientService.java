package com.hospito.service;

import com.hospito.dto.EmergencySummaryResponse;
import com.hospito.dto.PatientSummaryResponse;
import com.hospito.entity.MedicalRecord;
import com.hospito.entity.PatientProfile;
import com.hospito.exception.ResourceNotFoundException;
import com.hospito.repository.MedicalRecordRepository;
import com.hospito.repository.PatientProfileRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PatientService {

    private final PatientProfileRepository patientProfileRepository;
    private final MedicalRecordRepository medicalRecordRepository;

    public PatientService(
            PatientProfileRepository patientProfileRepository,
            MedicalRecordRepository medicalRecordRepository
    ) {
        this.patientProfileRepository = patientProfileRepository;
        this.medicalRecordRepository = medicalRecordRepository;
    }

    public PatientProfile getPatientProfileByUserId(Long userId) {
        return patientProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
    }

    public List<PatientSummaryResponse> listPatientsForAdmin() {
        return patientProfileRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public EmergencySummaryResponse emergencySummary(Long patientUserId) {
        PatientProfile patient = getPatientProfileByUserId(patientUserId);

        List<String> diagnoses = medicalRecordRepository.findByPatientIdOrderByRecordDateDesc(patient.getId())
                .stream()
                .map(MedicalRecord::getDiagnosis)
                .filter(value -> value != null && !value.isBlank())
                .distinct()
                .limit(5)
                .toList();

        String medicalProblems = (patient.getAllergies() == null || patient.getAllergies().isBlank())
                ? "No allergy or chronic condition entered"
                : patient.getAllergies();

        return new EmergencySummaryResponse(
                patient.getId(),
                patient.getUser().getFullName(),
                patient.getBloodGroup(),
                medicalProblems,
                patient.getHeightCm(),
                patient.getWeightKg(),
                patient.getEmergencyContactName(),
                patient.getEmergencyContactPhone(),
                diagnoses
        );
    }

    private PatientSummaryResponse toResponse(PatientProfile patient) {
        return new PatientSummaryResponse(
                patient.getId(),
                patient.getUser().getId(),
                patient.getUser().getFullName(),
                patient.getUser().getEmail(),
                patient.getUser().getPhone(),
                patient.getBloodGroup(),
                patient.getEmergencyContactName(),
                patient.getEmergencyContactPhone(),
                patient.getProfilePhotoPath() == null ? null : "/uploads/" + patient.getProfilePhotoPath()
        );
    }
}
