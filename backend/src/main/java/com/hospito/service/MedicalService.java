package com.hospito.service;

import com.hospito.dto.*;
import com.hospito.entity.*;
import com.hospito.exception.BadRequestException;
import com.hospito.exception.ForbiddenException;
import com.hospito.exception.ResourceNotFoundException;
import com.hospito.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MedicalService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final AppointmentRepository appointmentRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    public MedicalService(
            MedicalRecordRepository medicalRecordRepository,
            PrescriptionRepository prescriptionRepository,
            DoctorProfileRepository doctorProfileRepository,
            PatientProfileRepository patientProfileRepository,
            AppointmentRepository appointmentRepository,
            NotificationService notificationService,
            AuditService auditService
    ) {
        this.medicalRecordRepository = medicalRecordRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.appointmentRepository = appointmentRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @Transactional
    public MedicalRecordResponse createRecord(Long doctorUserId, MedicalRecordCreateRequest request) {
        DoctorProfile doctor = doctorProfileRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));

        PatientProfile patient = patientProfileRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        Appointment appointment = null;
        if (request.appointmentId() != null) {
            appointment = appointmentRepository.findById(request.appointmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
            if (!appointment.getDoctor().getId().equals(doctor.getId())) {
                throw new ForbiddenException("Appointment does not belong to this doctor");
            }
            if (!appointment.getPatient().getId().equals(patient.getId())) {
                throw new BadRequestException("Patient does not match appointment");
            }
        }

        MedicalRecord record = new MedicalRecord();
        record.setDoctor(doctor);
        record.setPatient(patient);
        record.setAppointment(appointment);
        record.setRecordDate(request.recordDate());
        record.setDiagnosis(request.diagnosis());
        record.setNotes(request.notes());
        record.setReportPath(request.reportPath());

        MedicalRecord saved = medicalRecordRepository.save(record);

        notificationService.createNotification(
                patient.getUser(),
                "Medical Record Updated",
                "Dr. " + doctor.getUser().getFullName() + " added your medical record.",
                NotificationType.DOCTOR_MESSAGE,
                saved.getId()
        );

        auditService.log(
                doctor.getUser(),
                "MEDICAL_RECORD_CREATED",
                "MEDICAL_RECORD",
                saved.getId(),
                "Created record for patientId=" + patient.getId()
        );

        return toResponse(saved);
    }

    public List<MedicalRecordResponse> getPatientRecords(Long patientUserId) {
        PatientProfile patient = patientProfileRepository.findByUserId(patientUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
        return medicalRecordRepository.findByPatientIdOrderByRecordDateDesc(patient.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<MedicalRecordResponse> getDoctorRecords(Long doctorUserId) {
        DoctorProfile doctor = doctorProfileRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));
        return medicalRecordRepository.findByDoctorIdOrderByRecordDateDesc(doctor.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PrescriptionResponse createPrescription(Long doctorUserId, PrescriptionCreateRequest request) {
        DoctorProfile doctor = doctorProfileRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));

        Appointment appointment = appointmentRepository.findById(request.appointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        if (!appointment.getDoctor().getId().equals(doctor.getId())) {
            throw new ForbiddenException("Appointment does not belong to this doctor");
        }

        if (appointment.getStatus() == AppointmentStatus.CANCELLED || appointment.getStatus() == AppointmentStatus.REJECTED) {
            throw new BadRequestException("Cannot prescribe for cancelled/rejected appointments");
        }

        Prescription prescription = new Prescription();
        prescription.setAppointment(appointment);
        prescription.setDoctor(doctor);
        prescription.setPatient(appointment.getPatient());
        prescription.setMedication(request.medication());
        prescription.setDosage(request.dosage());
        prescription.setInstructions(request.instructions());

        Prescription saved = prescriptionRepository.save(prescription);

        notificationService.createNotification(
                appointment.getPatient().getUser(),
                "New Prescription",
                "A prescription was issued by Dr. " + doctor.getUser().getFullName(),
                NotificationType.DOCTOR_MESSAGE,
                saved.getId()
        );

        auditService.log(
                doctor.getUser(),
                "PRESCRIPTION_CREATED",
                "PRESCRIPTION",
                saved.getId(),
                "Created prescription for appointmentId=" + appointment.getId()
        );

        return toResponse(saved);
    }

    public List<PrescriptionResponse> getPatientPrescriptions(Long patientUserId) {
        PatientProfile patient = patientProfileRepository.findByUserId(patientUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
        return prescriptionRepository.findByPatientIdOrderByIssuedAtDesc(patient.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<PrescriptionResponse> getDoctorPrescriptions(Long doctorUserId) {
        DoctorProfile doctor = doctorProfileRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));
        return prescriptionRepository.findByDoctorIdOrderByIssuedAtDesc(doctor.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private MedicalRecordResponse toResponse(MedicalRecord record) {
        return new MedicalRecordResponse(
                record.getId(),
                record.getPatient().getId(),
                record.getPatient().getUser().getFullName(),
                record.getDoctor() == null ? null : record.getDoctor().getId(),
                record.getDoctor() == null ? null : record.getDoctor().getUser().getFullName(),
                record.getAppointment() == null ? null : record.getAppointment().getId(),
                record.getRecordDate(),
                record.getDiagnosis(),
                record.getNotes(),
                record.getReportPath() == null ? null : "/uploads/" + record.getReportPath()
        );
    }

    private PrescriptionResponse toResponse(Prescription prescription) {
        return new PrescriptionResponse(
                prescription.getId(),
                prescription.getAppointment().getId(),
                prescription.getDoctor().getId(),
                prescription.getDoctor().getUser().getFullName(),
                prescription.getPatient().getId(),
                prescription.getPatient().getUser().getFullName(),
                prescription.getMedication(),
                prescription.getDosage(),
                prescription.getInstructions(),
                prescription.getIssuedAt()
        );
    }
}
