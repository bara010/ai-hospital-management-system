package com.hospito.service;

import com.hospito.dto.*;
import com.hospito.entity.DoctorApprovalStatus;
import com.hospito.entity.DoctorAvailability;
import com.hospito.entity.DoctorProfile;
import com.hospito.exception.BadRequestException;
import com.hospito.exception.ResourceNotFoundException;
import com.hospito.repository.DoctorAvailabilityRepository;
import com.hospito.repository.DoctorProfileRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.util.ArrayList;
import java.util.List;

@Service
public class DoctorService {

    private final DoctorProfileRepository doctorProfileRepository;
    private final DoctorAvailabilityRepository doctorAvailabilityRepository;

    public DoctorService(
            DoctorProfileRepository doctorProfileRepository,
            DoctorAvailabilityRepository doctorAvailabilityRepository
    ) {
        this.doctorProfileRepository = doctorProfileRepository;
        this.doctorAvailabilityRepository = doctorAvailabilityRepository;
    }

    public List<DoctorCardResponse> listApprovedDoctors(String specialization) {
        List<DoctorProfile> doctors;
        if (specialization != null && !specialization.isBlank()) {
            doctors = doctorProfileRepository.findByApprovalStatusAndSpecializationContainingIgnoreCase(
                    DoctorApprovalStatus.APPROVED,
                    specialization.trim()
            );
        } else {
            doctors = doctorProfileRepository.findByApprovalStatus(DoctorApprovalStatus.APPROVED);
        }

        return doctors.stream().map(this::toDoctorCardResponse).toList();
    }

    public List<AdminDoctorResponse> listAllDoctorsForAdmin() {
        return doctorProfileRepository.findAll().stream()
                .map(this::toAdminDoctorResponse)
                .toList();
    }

    public DoctorProfile getDoctorProfile(Long doctorId) {
        return doctorProfileRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
    }

    public DoctorProfile getDoctorProfileByUserId(Long userId) {
        return doctorProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));
    }

    public List<DoctorAvailabilityResponse> getAvailability(Long doctorId) {
        return doctorAvailabilityRepository.findByDoctorIdAndActiveTrue(doctorId).stream()
                .map(this::toAvailabilityResponse)
                .toList();
    }

    @Transactional
    public List<DoctorAvailabilityResponse> updateAvailability(Long doctorUserId, List<DoctorAvailabilityRequest> requests) {
        DoctorProfile doctor = getDoctorProfileByUserId(doctorUserId);

        List<DoctorAvailability> existing = doctorAvailabilityRepository.findByDoctorIdAndActiveTrue(doctor.getId());
        for (DoctorAvailability availability : existing) {
            availability.setActive(false);
        }
        doctorAvailabilityRepository.saveAll(existing);

        List<DoctorAvailability> newEntries = new ArrayList<>();
        for (DoctorAvailabilityRequest request : requests) {
            if (!request.startTime().isBefore(request.endTime())) {
                throw new BadRequestException("Availability start time must be before end time");
            }

            DoctorAvailability availability = new DoctorAvailability();
            availability.setDoctor(doctor);
            availability.setDayOfWeek(request.dayOfWeek());
            availability.setStartTime(request.startTime());
            availability.setEndTime(request.endTime());
            availability.setActive(request.active());
            newEntries.add(availability);
        }

        return doctorAvailabilityRepository.saveAll(newEntries).stream()
                .map(this::toAvailabilityResponse)
                .toList();
    }

    @Transactional
    public AdminDoctorResponse updateApproval(Long doctorId, DoctorApprovalUpdateRequest request) {
        DoctorProfile doctor = getDoctorProfile(doctorId);
        doctor.setApprovalStatus(request.status());
        DoctorProfile saved = doctorProfileRepository.save(doctor);
        return toAdminDoctorResponse(saved);
    }

    public DoctorCardResponse toDoctorCardResponse(DoctorProfile doctor) {
        List<DoctorAvailabilityResponse> schedules = doctorAvailabilityRepository.findByDoctorIdAndActiveTrue(doctor.getId())
                .stream()
                .map(this::toAvailabilityResponse)
                .toList();

        String availability = schedules.isEmpty()
                ? "No schedule provided"
                : schedules.stream()
                .map(s -> DayOfWeek.of(s.dayOfWeek()) + " " + s.startTime() + "-" + s.endTime())
                .reduce((a, b) -> a + ", " + b)
                .orElse("No schedule provided");

        return new DoctorCardResponse(
                doctor.getId(),
                doctor.getUser().getFullName(),
                doctor.getSpecialization(),
                availability,
                doctor.getRatingAverage(),
                doctor.getRatingCount(),
                doctor.getProfilePhotoPath() == null ? null : "/uploads/" + doctor.getProfilePhotoPath(),
                doctor.getApprovalStatus(),
                schedules
        );
    }

    public DoctorAvailabilityResponse toAvailabilityResponse(DoctorAvailability availability) {
        return new DoctorAvailabilityResponse(
                availability.getId(),
                availability.getDayOfWeek(),
                availability.getStartTime(),
                availability.getEndTime(),
                availability.isActive()
        );
    }

    private AdminDoctorResponse toAdminDoctorResponse(DoctorProfile doctor) {
        return new AdminDoctorResponse(
                doctor.getId(),
                doctor.getUser().getId(),
                doctor.getUser().getFullName(),
                doctor.getUser().getEmail(),
                doctor.getUser().getPhone(),
                doctor.getSpecialization(),
                doctor.getQualification(),
                doctor.getYearsExperience(),
                doctor.getApprovalStatus()
        );
    }
}
