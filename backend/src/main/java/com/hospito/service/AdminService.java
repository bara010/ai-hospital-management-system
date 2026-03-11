package com.hospito.service;

import com.hospito.dto.AdminDashboardResponse;
import com.hospito.repository.AppointmentRepository;
import com.hospito.repository.DoctorProfileRepository;
import com.hospito.repository.PatientProfileRepository;
import com.hospito.entity.DoctorApprovalStatus;
import org.springframework.stereotype.Service;

@Service
public class AdminService {

    private final PatientProfileRepository patientProfileRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final AppointmentRepository appointmentRepository;

    public AdminService(
            PatientProfileRepository patientProfileRepository,
            DoctorProfileRepository doctorProfileRepository,
            AppointmentRepository appointmentRepository
    ) {
        this.patientProfileRepository = patientProfileRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.appointmentRepository = appointmentRepository;
    }

    public AdminDashboardResponse dashboard() {
        return new AdminDashboardResponse(
                patientProfileRepository.count(),
                doctorProfileRepository.count(),
                appointmentRepository.count(),
                doctorProfileRepository.findByApprovalStatus(DoctorApprovalStatus.PENDING).size()
        );
    }
}
