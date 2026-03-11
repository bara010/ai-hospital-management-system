package com.hospito.service;

import com.hospito.dto.ProfileResponse;
import com.hospito.dto.ProfileUpdateRequest;
import com.hospito.entity.DoctorProfile;
import com.hospito.entity.PatientProfile;
import com.hospito.entity.Role;
import com.hospito.entity.User;
import com.hospito.exception.ResourceNotFoundException;
import com.hospito.repository.DoctorProfileRepository;
import com.hospito.repository.PatientProfileRepository;
import com.hospito.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class ProfileService {

    private final UserRepository userRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final DoctorProfileRepository doctorProfileRepository;

    public ProfileService(
            UserRepository userRepository,
            PatientProfileRepository patientProfileRepository,
            DoctorProfileRepository doctorProfileRepository
    ) {
        this.userRepository = userRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.doctorProfileRepository = doctorProfileRepository;
    }

    public ProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return toResponse(user);
    }

    @Transactional
    public ProfileResponse updateProfile(Long userId, ProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.firstName() != null) {
            user.setFirstName(request.firstName());
        }
        if (request.lastName() != null) {
            user.setLastName(request.lastName());
        }
        if (request.phone() != null) {
            user.setPhone(request.phone());
        }
        userRepository.save(user);

        if (user.getRole() == Role.PATIENT) {
            PatientProfile patient = patientProfileRepository.findByUserId(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
            if (request.address() != null) {
                patient.setAddress(request.address());
            }
            if (request.bloodGroup() != null) {
                patient.setBloodGroup(request.bloodGroup());
            }
            if (request.allergies() != null) {
                patient.setAllergies(request.allergies());
            }
            if (request.heightCm() != null) {
                patient.setHeightCm(request.heightCm());
            }
            if (request.weightKg() != null) {
                patient.setWeightKg(request.weightKg());
            }
            if (request.emergencyContactName() != null) {
                patient.setEmergencyContactName(request.emergencyContactName());
            }
            if (request.emergencyContactPhone() != null) {
                patient.setEmergencyContactPhone(request.emergencyContactPhone());
            }
            if (request.dateOfBirth() != null) {
                patient.setDateOfBirth(request.dateOfBirth());
            }
            patientProfileRepository.save(patient);
        } else if (user.getRole() == Role.DOCTOR) {
            DoctorProfile doctor = doctorProfileRepository.findByUserId(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));
            if (request.specialization() != null) {
                doctor.setSpecialization(request.specialization());
            }
            if (request.qualification() != null) {
                doctor.setQualification(request.qualification());
            }
            if (request.yearsExperience() != null) {
                doctor.setYearsExperience(request.yearsExperience());
            }
            if (request.bio() != null) {
                doctor.setBio(request.bio());
            }
            if (request.availabilityNotes() != null) {
                doctor.setAvailabilityNotes(request.availabilityNotes());
            }
            doctorProfileRepository.save(doctor);
        }

        return toResponse(user);
    }

    @Transactional
    public ProfileResponse updateProfilePhoto(Long userId, String path) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() == Role.PATIENT) {
            PatientProfile patient = patientProfileRepository.findByUserId(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
            patient.setProfilePhotoPath(path);
            patientProfileRepository.save(patient);
        } else if (user.getRole() == Role.DOCTOR) {
            DoctorProfile doctor = doctorProfileRepository.findByUserId(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));
            doctor.setProfilePhotoPath(path);
            doctorProfileRepository.save(doctor);
        }

        return toResponse(user);
    }

    private ProfileResponse toResponse(User user) {
        if (user.getRole() == Role.PATIENT) {
            PatientProfile p = patientProfileRepository.findByUserId(user.getId())
                    .orElse(null);
            return new ProfileResponse(
                    user.getId(),
                    user.getRole(),
                    user.getEmail(),
                    user.getFirstName(),
                    user.getLastName(),
                    user.getPhone(),
                    p == null ? null : p.getAddress(),
                    p == null ? null : p.getBloodGroup(),
                    p == null ? null : p.getAllergies(),
                    p == null ? null : p.getHeightCm(),
                    p == null ? null : p.getWeightKg(),
                    p == null ? null : p.getEmergencyContactName(),
                    p == null ? null : p.getEmergencyContactPhone(),
                    p == null ? null : p.getDateOfBirth(),
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    p == null || p.getProfilePhotoPath() == null ? null : "/uploads/" + p.getProfilePhotoPath()
            );
        }

        if (user.getRole() == Role.DOCTOR) {
            DoctorProfile d = doctorProfileRepository.findByUserId(user.getId())
                    .orElse(null);
            return new ProfileResponse(
                    user.getId(),
                    user.getRole(),
                    user.getEmail(),
                    user.getFirstName(),
                    user.getLastName(),
                    user.getPhone(),
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    d == null ? null : d.getSpecialization(),
                    d == null ? null : d.getQualification(),
                    d == null ? null : d.getYearsExperience(),
                    d == null ? null : d.getBio(),
                    d == null ? null : d.getAvailabilityNotes(),
                    d == null ? null : d.getApprovalStatus(),
                    d == null ? null : d.getRatingAverage(),
                    d == null ? null : d.getRatingCount(),
                    d == null || d.getProfilePhotoPath() == null ? null : "/uploads/" + d.getProfilePhotoPath()
            );
        }

        return new ProfileResponse(
                user.getId(),
                user.getRole(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhone(),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
    }
}
