package com.hospito.service;

import com.hospito.dto.DoctorRatingRequest;
import com.hospito.dto.DoctorRatingResponse;
import com.hospito.entity.*;
import com.hospito.exception.BadRequestException;
import com.hospito.exception.ForbiddenException;
import com.hospito.exception.ResourceNotFoundException;
import com.hospito.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class RatingService {

    private final DoctorRatingRepository doctorRatingRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorProfileRepository doctorProfileRepository;

    public RatingService(
            DoctorRatingRepository doctorRatingRepository,
            PatientProfileRepository patientProfileRepository,
            AppointmentRepository appointmentRepository,
            DoctorProfileRepository doctorProfileRepository
    ) {
        this.doctorRatingRepository = doctorRatingRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.appointmentRepository = appointmentRepository;
        this.doctorProfileRepository = doctorProfileRepository;
    }

    @Transactional
    public DoctorRatingResponse submitRating(Long patientUserId, DoctorRatingRequest request) {
        PatientProfile patient = patientProfileRepository.findByUserId(patientUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        Appointment appointment = appointmentRepository.findById(request.appointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        if (!appointment.getPatient().getId().equals(patient.getId())) {
            throw new ForbiddenException("You cannot rate this appointment");
        }

        if (appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw new BadRequestException("You can rate only completed appointments");
        }

        if (doctorRatingRepository.findByAppointmentIdAndPatientId(appointment.getId(), patient.getId()).isPresent()) {
            throw new BadRequestException("Rating already submitted for this appointment");
        }

        DoctorRating rating = new DoctorRating();
        rating.setAppointment(appointment);
        rating.setDoctor(appointment.getDoctor());
        rating.setPatient(patient);
        rating.setRating(request.rating());
        rating.setReview(request.review());

        DoctorRating saved = doctorRatingRepository.save(rating);
        recalculateDoctorRating(appointment.getDoctor().getId());

        return toResponse(saved);
    }

    public List<DoctorRatingResponse> listRatingsForDoctor(Long doctorId) {
        return doctorRatingRepository.findByDoctorId(doctorId).stream()
                .map(this::toResponse)
                .toList();
    }

    private void recalculateDoctorRating(Long doctorId) {
        DoctorProfile doctor = doctorProfileRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        List<DoctorRating> ratings = doctorRatingRepository.findByDoctorId(doctorId);
        int count = ratings.size();
        BigDecimal average = count == 0 ? BigDecimal.ZERO :
                BigDecimal.valueOf(
                        ratings.stream().mapToInt(DoctorRating::getRating).average().orElse(0.0)
                ).setScale(2, RoundingMode.HALF_UP);

        doctor.setRatingCount(count);
        doctor.setRatingAverage(average);
        doctorProfileRepository.save(doctor);
    }

    private DoctorRatingResponse toResponse(DoctorRating rating) {
        return new DoctorRatingResponse(
                rating.getId(),
                rating.getAppointment().getId(),
                rating.getPatient().getId(),
                rating.getPatient().getUser().getFullName(),
                rating.getRating(),
                rating.getReview(),
                rating.getCreatedAt()
        );
    }
}
