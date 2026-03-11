package com.hospito.service;

import com.hospito.dto.*;
import com.hospito.entity.*;
import com.hospito.exception.BadRequestException;
import com.hospito.exception.ResourceNotFoundException;
import com.hospito.exception.UnauthorizedException;
import com.hospito.repository.DoctorAvailabilityRepository;
import com.hospito.repository.DoctorProfileRepository;
import com.hospito.repository.PatientProfileRepository;
import com.hospito.repository.UserRepository;
import com.hospito.security.AuthUser;
import com.hospito.security.JwtService;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final DoctorAvailabilityRepository doctorAvailabilityRepository;
    private final PasswordEncoder passwordEncoder;
    private final TotpService totpService;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PatientProfileRepository patientProfileRepository,
            DoctorProfileRepository doctorProfileRepository,
            DoctorAvailabilityRepository doctorAvailabilityRepository,
            PasswordEncoder passwordEncoder,
            TotpService totpService,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.doctorProfileRepository = doctorProfileRepository;
        this.doctorAvailabilityRepository = doctorAvailabilityRepository;
        this.passwordEncoder = passwordEncoder;
        this.totpService = totpService;
        this.jwtService = jwtService;
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new BadRequestException("Email already registered");
        }

        if (request.role() == Role.DOCTOR && (request.specialization() == null || request.specialization().isBlank())) {
            throw new BadRequestException("Doctor specialization is required");
        }

        User user = new User();
        user.setEmail(request.email().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setPhone(request.phone());
        user.setRole(request.role());
        user.setEnabled(true);
        user.setTotpEnabled(false);
        user.setTotpSecret(totpService.generateSecret());

        User savedUser = userRepository.save(user);

        if (savedUser.getRole() == Role.PATIENT) {
            PatientProfile patient = new PatientProfile();
            patient.setUser(savedUser);
            patient.setDateOfBirth(request.dateOfBirth());
            patient.setBloodGroup(request.bloodGroup());
            patient.setAddress(request.address());
            patient.setAllergies(request.allergies());
            patient.setEmergencyContactName(request.emergencyContactName());
            patient.setEmergencyContactPhone(request.emergencyContactPhone());
            patientProfileRepository.save(patient);
        } else if (savedUser.getRole() == Role.DOCTOR) {
            DoctorProfile doctor = new DoctorProfile();
            doctor.setUser(savedUser);
            doctor.setSpecialization(request.specialization());
            doctor.setQualification(request.qualification());
            doctor.setYearsExperience(request.yearsExperience());
            doctor.setApprovalStatus(DoctorApprovalStatus.APPROVED);

            DoctorProfile savedDoctor = doctorProfileRepository.save(doctor);
            createDefaultAvailability(savedDoctor);
        }

        String otpAuthUrl = totpService.buildOtpAuthUrl(savedUser.getEmail(), savedUser.getTotpSecret());
        String qrCode = totpService.generateQrCodeDataUrl(otpAuthUrl);

        return new RegisterResponse(
                "Registration successful. Scan QR and verify TOTP to activate login.",
                savedUser.getEmail(),
                savedUser.getTotpSecret(),
                otpAuthUrl,
                qrCode
        );
    }

    @Transactional
    public SimpleMessageResponse verifyRegistrationTotp(VerifyTotpRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!totpService.verifyCode(user.getTotpSecret(), request.code())) {
            throw new UnauthorizedException("Invalid TOTP code");
        }

        user.setTotpEnabled(true);
        userRepository.save(user);
        return new SimpleMessageResponse("TOTP verification successful. You can now log in.");
    }

    public LoginChallengeResponse loginStart(LoginStartRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid credentials");
        }

        if (!user.isTotpEnabled()) {
            throw new UnauthorizedException("TOTP not verified for this account");
        }

        String challengeToken = jwtService.generateLoginChallenge(user);
        return new LoginChallengeResponse(challengeToken, "Password verified. Submit TOTP code.");
    }

    public AuthResponse loginVerify(LoginVerifyRequest request) {
        AuthUser challengeUser = jwtService.toChallengeUser(request.challengeToken());

        User user = userRepository.findById(challengeUser.getId())
                .orElseThrow(() -> new UnauthorizedException("Invalid login challenge"));

        if (!totpService.verifyCode(user.getTotpSecret(), request.code())) {
            throw new UnauthorizedException("Invalid TOTP code");
        }

        String token = jwtService.generateAccessToken(user);
        return new AuthResponse(token, "Bearer", toUserDto(user));
    }

    public AuthResponse loginWithTotp(LoginWithTotpRequest request) {
        LoginChallengeResponse challenge = loginStart(new LoginStartRequest(request.email(), request.password()));
        return loginVerify(new LoginVerifyRequest(challenge.challengeToken(), request.code()));
    }

    @Transactional
    public SimpleMessageResponse updateFcmToken(Long userId, FcmTokenRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setFcmToken(request.token());
        userRepository.save(user);
        return new SimpleMessageResponse("FCM token updated");
    }

    public UserDto toUserDto(User user) {
        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhone(),
                user.getRole()
        );
    }

    private void createDefaultAvailability(DoctorProfile doctor) {
        List<DoctorAvailability> slots = new ArrayList<>();
        for (int day = 1; day <= 5; day++) {
            DoctorAvailability availability = new DoctorAvailability();
            availability.setDoctor(doctor);
            availability.setDayOfWeek(day);
            availability.setStartTime(LocalTime.of(9, 0));
            availability.setEndTime(LocalTime.of(17, 0));
            availability.setActive(true);
            slots.add(availability);
        }
        doctorAvailabilityRepository.saveAll(slots);
    }
}
