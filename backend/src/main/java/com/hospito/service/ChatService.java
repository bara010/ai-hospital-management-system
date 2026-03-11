package com.hospito.service;

import com.hospito.dto.ChatContactResponse;
import com.hospito.dto.ChatMessageRequest;
import com.hospito.dto.ChatMessageResponse;
import com.hospito.entity.*;
import com.hospito.exception.BadRequestException;
import com.hospito.exception.ForbiddenException;
import com.hospito.exception.ResourceNotFoundException;
import com.hospito.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final AppointmentRepository appointmentRepository;

    public ChatService(
            ChatMessageRepository chatMessageRepository,
            UserRepository userRepository,
            PatientProfileRepository patientProfileRepository,
            DoctorProfileRepository doctorProfileRepository,
            AppointmentRepository appointmentRepository
    ) {
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.appointmentRepository = appointmentRepository;
    }

    @Transactional
    public ChatMessageResponse sendMessage(Long senderUserId, ChatMessageRequest request) {
        User sender = userRepository.findById(senderUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));

        User recipient = userRepository.findById(request.recipientId())
                .orElseThrow(() -> new ResourceNotFoundException("Recipient not found"));

        validateParticipants(sender, recipient);
        ensureConnectedByAppointment(sender, recipient);

        boolean hasText = request.message() != null && !request.message().isBlank();
        boolean hasAttachment = request.attachmentPath() != null && !request.attachmentPath().isBlank();

        if (!hasText && !hasAttachment) {
            throw new BadRequestException("Message text or attachment is required");
        }

        ChatMessage message = new ChatMessage();
        message.setSender(sender);
        message.setRecipient(recipient);
        message.setMessageText(hasText ? request.message().trim() : null);
        message.setAttachmentPath(hasAttachment ? request.attachmentPath().trim() : null);
        message.setAttachmentName(request.attachmentName());
        message.setRead(false);

        ChatMessage saved = chatMessageRepository.save(message);
        return toResponse(saved);
    }

    @Transactional
    public List<ChatMessageResponse> conversation(Long currentUserId, Long otherUserId) {
        User current = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        User other = userRepository.findById(otherUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        validateParticipants(current, other);
        ensureConnectedByAppointment(current, other);

        List<ChatMessage> messages = chatMessageRepository.findConversation(currentUserId, otherUserId);

        boolean changed = false;
        for (ChatMessage message : messages) {
            if (message.getRecipient().getId().equals(currentUserId) && !message.isRead()) {
                message.setRead(true);
                changed = true;
            }
        }
        if (changed) {
            chatMessageRepository.saveAll(messages);
        }

        return messages.stream().map(this::toResponse).toList();
    }

    public List<ChatContactResponse> contacts(Long currentUserId) {
        User current = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<User> contacts = switch (current.getRole()) {
            case PATIENT -> patientContacts(current);
            case DOCTOR -> doctorContacts(current);
            default -> List.of();
        };

        Map<Long, ChatMessage> latestByCounterpart = new HashMap<>();
        for (ChatMessage message : chatMessageRepository.findRecentForUser(currentUserId)) {
            Long otherId = message.getSender().getId().equals(currentUserId)
                    ? message.getRecipient().getId()
                    : message.getSender().getId();
            latestByCounterpart.putIfAbsent(otherId, message);
        }

        return contacts.stream()
                .distinct()
                .map(contact -> {
                    ChatMessage latest = latestByCounterpart.get(contact.getId());
                    return new ChatContactResponse(
                            contact.getId(),
                            contact.getFullName(),
                            contact.getEmail(),
                            contact.getRole(),
                            profilePictureUrl(contact),
                            specialization(contact),
                            latest == null ? null : preview(latest),
                            latest == null ? null : latest.getCreatedAt()
                    );
                })
                .sorted((a, b) -> {
                    Instant atA = a.latestMessageAt();
                    Instant atB = b.latestMessageAt();
                    if (atA == null && atB == null) return a.fullName().compareToIgnoreCase(b.fullName());
                    if (atA == null) return 1;
                    if (atB == null) return -1;
                    return atB.compareTo(atA);
                })
                .toList();
    }

    private List<User> patientContacts(User patientUser) {
        PatientProfile patient = patientProfileRepository.findByUserId(patientUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        return appointmentRepository.findByPatientIdOrderByStartTimeDesc(patient.getId())
                .stream()
                .map(appointment -> appointment.getDoctor().getUser())
                .toList();
    }

    private List<User> doctorContacts(User doctorUser) {
        DoctorProfile doctor = doctorProfileRepository.findByUserId(doctorUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));

        return appointmentRepository.findByDoctorIdOrderByStartTimeDesc(doctor.getId())
                .stream()
                .map(appointment -> appointment.getPatient().getUser())
                .toList();
    }

    private void validateParticipants(User sender, User recipient) {
        if (sender.getId().equals(recipient.getId())) {
            throw new BadRequestException("You cannot message yourself");
        }

        boolean validRoles =
                (sender.getRole() == Role.PATIENT && recipient.getRole() == Role.DOCTOR)
                        || (sender.getRole() == Role.DOCTOR && recipient.getRole() == Role.PATIENT);

        if (!validRoles) {
            throw new ForbiddenException("Messaging is allowed only between patient and doctor");
        }
    }

    private void ensureConnectedByAppointment(User a, User b) {
        User doctorUser = a.getRole() == Role.DOCTOR ? a : b;
        User patientUser = a.getRole() == Role.PATIENT ? a : b;

        DoctorProfile doctor = doctorProfileRepository.findByUserId(doctorUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));
        PatientProfile patient = patientProfileRepository.findByUserId(patientUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        boolean connected = appointmentRepository.existsByDoctorIdAndPatientId(doctor.getId(), patient.getId());
        if (!connected) {
            throw new ForbiddenException("Messaging allowed only after appointment relationship exists");
        }
    }

    private String specialization(User user) {
        if (user.getRole() != Role.DOCTOR) return null;
        return doctorProfileRepository.findByUserId(user.getId())
                .map(DoctorProfile::getSpecialization)
                .orElse(null);
    }

    private String profilePictureUrl(User user) {
        if (user.getRole() == Role.DOCTOR) {
            return doctorProfileRepository.findByUserId(user.getId())
                    .map(DoctorProfile::getProfilePhotoPath)
                    .map(path -> "/uploads/" + path)
                    .orElse(null);
        }

        if (user.getRole() == Role.PATIENT) {
            return patientProfileRepository.findByUserId(user.getId())
                    .map(PatientProfile::getProfilePhotoPath)
                    .map(path -> "/uploads/" + path)
                    .orElse(null);
        }

        return null;
    }

    private String preview(ChatMessage message) {
        if (message.getMessageText() != null && !message.getMessageText().isBlank()) {
            return message.getMessageText();
        }
        if (message.getAttachmentName() != null && !message.getAttachmentName().isBlank()) {
            return "Attachment: " + message.getAttachmentName();
        }
        return "Attachment shared";
    }

    private ChatMessageResponse toResponse(ChatMessage message) {
        String attachmentUrl = null;
        if (message.getAttachmentPath() != null && !message.getAttachmentPath().isBlank()) {
            attachmentUrl = message.getAttachmentPath().startsWith("/uploads/")
                    ? message.getAttachmentPath()
                    : "/uploads/" + message.getAttachmentPath();
        }

        return new ChatMessageResponse(
                message.getId(),
                message.getSender().getId(),
                message.getSender().getFullName(),
                message.getRecipient().getId(),
                message.getRecipient().getFullName(),
                message.getMessageText(),
                attachmentUrl,
                message.getAttachmentName(),
                message.getCreatedAt(),
                message.isRead()
        );
    }
}
