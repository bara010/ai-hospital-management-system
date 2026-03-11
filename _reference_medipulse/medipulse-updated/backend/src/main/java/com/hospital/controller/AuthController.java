package com.hospital.controller;

import com.hospital.model.AuditLog;
import com.hospital.model.Doctor;
import com.hospital.model.Patient;
import com.hospital.model.User;
import com.hospital.repository.AuditLogRepository;
import com.hospital.repository.DoctorRepository;
import com.hospital.repository.PatientRepository;
import com.hospital.repository.UserRepository;
import com.hospital.security.JwtUtil;
import com.hospital.service.GoogleTotpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired private UserRepository userRepo;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private AuditLogRepository auditRepo;
    @Autowired private GoogleTotpService totpService;
    @Autowired private DoctorRepository doctorRepo;
    @Autowired private PatientRepository patientRepo;

    private static final Pattern EMAIL_REGEX = Pattern.compile(
        "^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$"
    );
    private static final Pattern PHONE_REGEX = Pattern.compile("^[+]?[0-9]{7,15}$");
    private static final Set<String> BLOCKED_DOMAINS = Set.of(
        "mailinator.com", "guerrillamail.com", "tempmail.com", "throwaway.com",
        "dispostable.com", "yopmail.com", "trashmail.com", "sharklasers.com",
        "spam4.me", "maildrop.cc", "getairmail.com", "fakeinbox.com"
    );

    private String validateEmailFormat(String email) {
        if (email == null || email.isBlank()) return "Email is required";
        email = email.trim().toLowerCase();
        if (!EMAIL_REGEX.matcher(email).matches())
            return "Invalid email format. Use something like name@domain.com";
        String domain = email.substring(email.indexOf('@') + 1);
        if (BLOCKED_DOMAINS.contains(domain))
            return "Disposable or temporary email addresses are not allowed";
        return null;
    }

    // ─── Email format check (Register.jsx live validation) ──────────────────
    @PostMapping("/validate-email")
    public ResponseEntity<?> validateEmailEndpoint(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String error = validateEmailFormat(email);
        if (error != null)
            return ResponseEntity.badRequest().body(Map.of("valid", false, "error", error));
        email = email.trim().toLowerCase();
        if (userRepo.existsByEmail(email))
            return ResponseEntity.badRequest().body(Map.of("valid", false, "error", "This email is already registered"));
        return ResponseEntity.ok(Map.of("valid", true, "message", "Email is valid"));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // REGISTRATION FLOW  — Step 1: validate fields + generate TOTP secret
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * POST /api/auth/register/setup-totp
     * Validates user fields, generates a TOTP secret, returns a QR code image
     * (base64 PNG) so the user can scan it in Google Authenticator.
     * The secret is stored TEMPORARILY in memory (pending map) until the user
     * verifies with a valid TOTP code.
     */
    private final Map<String, PendingRegistration> pendingRegistrations = new java.util.concurrent.ConcurrentHashMap<>();

    @PostMapping("/register/setup-totp")
    public ResponseEntity<?> registerSetupTotp(@RequestBody Map<String, String> body) {
        try {
            String email    = body.get("email");
            String name     = body.get("name");
            String password = body.get("password");
            String phone    = body.get("phone");
            String role     = body.getOrDefault("role", "PATIENT");
            String dept     = body.get("department");
            String spec     = body.get("specialization");

            String emailError = validateEmailFormat(email);
            if (emailError != null)
                return ResponseEntity.badRequest().body(Map.of("error", emailError));

            email = email.trim().toLowerCase();
            if (name == null || name.isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "Full name is required"));
            if (password == null || password.length() < 6)
                return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 6 characters"));
            if (phone == null || phone.isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "Phone number is required"));
            if (!PHONE_REGEX.matcher(phone.replaceAll("[\\s\\-()]", "")).matches())
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid phone number format"));
            if (userRepo.existsByEmail(email))
                return ResponseEntity.badRequest().body(Map.of("error", "This email is already registered"));

            // Generate TOTP secret and QR code
            String secret = totpService.generateSecret();
            String qrUri  = totpService.getQrCodeDataUri(email, secret);

            // Store pending registration for 10 minutes
            pendingRegistrations.put(email, new PendingRegistration(
                email, name.trim(), password, phone.trim(),
                role.toUpperCase(), dept, spec, secret,
                System.currentTimeMillis() + 10 * 60 * 1000
            ));

            return ResponseEntity.ok(Map.of(
                "message",    "Scan the QR code with Google Authenticator, then enter the 6-digit code to complete registration.",
                "qrCodeUri",  qrUri != null ? qrUri : "",
                "secret",     secret // also return plain secret for manual entry
            ));
        } catch (Exception e) {
            System.err.println("[AuthController] register/setup-totp error: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Setup failed. Please try again."));
        }
    }

    /**
     * POST /api/auth/register/verify-totp
     * User provides the 6-digit code from Google Authenticator.
     * If valid → save user to DB with totpEnabled=true, return JWT.
     */
    @PostMapping("/register/verify-totp")
    public ResponseEntity<?> registerVerifyTotp(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String code  = body.get("code");

            if (email == null || email.isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
            if (code == null || code.isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "Authenticator code is required"));

            email = email.trim().toLowerCase();
            PendingRegistration pending = pendingRegistrations.get(email);

            if (pending == null)
                return ResponseEntity.badRequest().body(Map.of("error", "No pending registration. Please start setup again."));
            if (System.currentTimeMillis() > pending.expiresAt) {
                pendingRegistrations.remove(email);
                return ResponseEntity.badRequest().body(Map.of("error", "Setup session expired. Please start again."));
            }
            if (userRepo.existsByEmail(email))
                return ResponseEntity.badRequest().body(Map.of("error", "This email is already registered"));

            if (!totpService.verifyCode(pending.totpSecret, code))
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid code. Make sure Google Authenticator is showing the current code."));

            // ✅ Code valid — save user
            User user = new User(email, passwordEncoder.encode(pending.password), pending.name, pending.role);
            user.setPhone(pending.phone);
            user.setTotpSecret(pending.totpSecret);
            user.setTotpEnabled(true);
            User saved = userRepo.save(user);
            pendingRegistrations.remove(email);

            // Auto-create doctor profile
            if ("DOCTOR".equalsIgnoreCase(saved.getRole())) {
                try {
                    Doctor doctor = new Doctor();
                    doctor.setUser(saved);
                    if (pending.department != null && !pending.department.isBlank())
                        doctor.setDepartment(pending.department.toUpperCase());
                    if (pending.specialization != null && !pending.specialization.isBlank())
                        doctor.setSpecialization(pending.specialization.trim());
                    doctorRepo.save(doctor);
                } catch (Exception ex) {
                    System.err.println("[AuthController] Doctor profile creation failed: " + ex.getMessage());
                }
            }

            // Auto-create patient profile
            if ("PATIENT".equalsIgnoreCase(saved.getRole())) {
                try {
                    Patient patient = new Patient();
                    patient.setUser(saved);
                    patient.setStatus("OUTPATIENT");
                    patientRepo.save(patient);
                } catch (Exception ex) {
                    System.err.println("[AuthController] Patient profile creation failed: " + ex.getMessage());
                }
            }

            try {
                auditRepo.save(new AuditLog(saved.getEmail(), saved.getName(), saved.getRole(),
                    "REGISTER", "System", "SUCCESS", "New account registered via Google Authenticator TOTP"));
            } catch (Exception ignored) {}

            String token = jwtUtil.generateToken(saved.getEmail(), saved.getRole());
            System.out.println("[AuthController] ✅ New user registered: " + saved.getEmail());

            return ResponseEntity.ok(Map.of(
                "token", token,
                "name",  saved.getName() != null ? saved.getName() : "",
                "email", saved.getEmail(),
                "role",  saved.getRole(),
                "id",    saved.getId()
            ));
        } catch (Exception e) {
            System.err.println("[AuthController] register/verify-totp error: " + e.getMessage());
            String msg = e.getMessage() != null && e.getMessage().contains("unique constraint")
                ? "This email is already registered." : "Registration failed: " + e.getMessage();
            return ResponseEntity.status(500).body(Map.of("error", msg));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LOGIN FLOW — Step 1: verify password, Step 2: verify TOTP code
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/login/send-otp")
    public ResponseEntity<?> loginSendOtp(@RequestBody Map<String, String> body) {
        try {
            String email    = body.get("email");
            String password = body.get("password");

            if (email == null || email.isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
            if (password == null || password.isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "Password is required"));

            String emailError = validateEmailFormat(email);
            if (emailError != null)
                return ResponseEntity.badRequest().body(Map.of("error", emailError));

            email = email.trim().toLowerCase();
            Optional<User> optUser = userRepo.findByEmail(email);
            if (optUser.isEmpty())
                return ResponseEntity.status(401).body(Map.of("error", "No account found with this email"));
            if (!passwordEncoder.matches(password, optUser.get().getPassword()))
                return ResponseEntity.status(401).body(Map.of("error", "Incorrect password"));

            User user = optUser.get();
            if (!user.isTotpEnabled() || user.getTotpSecret() == null)
                return ResponseEntity.status(401).body(Map.of("error",
                    "Google Authenticator is not set up for this account. Please contact admin."));

            return ResponseEntity.ok(Map.of(
                "message",     "Password verified. Enter the 6-digit code from Google Authenticator.",
                "maskedEmail", maskEmail(email),
                "requireTotp", true
            ));
        } catch (Exception e) {
            System.err.println("[AuthController] login/send-otp error: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Login failed. Please try again."));
        }
    }

    @PostMapping("/login/verify-otp")
    public ResponseEntity<?> loginVerifyOtp(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String code  = body.get("otp");  // frontend sends "otp" field

            if (email == null || email.isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
            if (code == null || code.isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "Authenticator code is required"));

            email = email.trim().toLowerCase();

            Optional<User> optUser = userRepo.findByEmail(email);
            if (optUser.isEmpty())
                return ResponseEntity.status(401).body(Map.of("error", "Account not found"));

            User user = optUser.get();
            if (!user.isTotpEnabled() || user.getTotpSecret() == null)
                return ResponseEntity.status(401).body(Map.of("error", "Google Authenticator not configured for this account"));

            if (!totpService.verifyCode(user.getTotpSecret(), code))
                return ResponseEntity.badRequest().body(Map.of("error",
                    "Invalid code. Make sure you're using the current 6-digit code from Google Authenticator."));

            String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
            try {
                auditRepo.save(new AuditLog(user.getEmail(), user.getName(), user.getRole(),
                    "LOGIN", "System", "SUCCESS", "Login via Google Authenticator TOTP"));
            } catch (Exception ignored) {}

            System.out.println("[AuthController] ✅ Login successful: " + user.getEmail());
            return ResponseEntity.ok(Map.of(
                "token", token,
                "name",  user.getName() != null ? user.getName() : "",
                "email", user.getEmail(),
                "role",  user.getRole(),
                "id",    user.getId()
            ));
        } catch (Exception e) {
            System.err.println("[AuthController] login/verify-otp error: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Verification failed. Please try again."));
        }
    }

    // ─── Admin: reset TOTP (re-setup) ─────────────────────────────────────────
    @PostMapping("/totp/reset/{userId}")
    public ResponseEntity<?> resetTotp(@PathVariable Long userId) {
        return userRepo.findById(userId).map(u -> {
            u.setTotpSecret(null);
            u.setTotpEnabled(false);
            userRepo.save(u);
            return ResponseEntity.ok(Map.of("message", "TOTP reset. User must set up Google Authenticator again on next login."));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ─── Quick demo login — bypasses TOTP (for admin demo buttons only) ───────
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        try {
            String email    = body.get("email");
            String password = body.get("password");
            if (email == null || email.isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
            if (password == null || password.isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "Password is required"));

            Optional<User> optUser = userRepo.findByEmail(email.trim().toLowerCase());
            if (optUser.isEmpty())
                return ResponseEntity.status(401).body(Map.of("error", "No account found with this email"));
            if (!passwordEncoder.matches(password, optUser.get().getPassword()))
                return ResponseEntity.status(401).body(Map.of("error", "Incorrect password"));

            User user  = optUser.get();
            String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
            try {
                auditRepo.save(new AuditLog(user.getEmail(), user.getName(), user.getRole(),
                    "LOGIN", "System", "SUCCESS", "Quick login (demo)"));
            } catch (Exception ignored) {}
            return ResponseEntity.ok(Map.of(
                "token", token, "name", user.getName() != null ? user.getName() : "",
                "email", user.getEmail(), "role", user.getRole(), "id", user.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Login failed. Please try again."));
        }
    }

    // ─── Admin: Get all users ─────────────────────────────────────────────────
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        try {
            List<Map<String, Object>> users = userRepo.findAll().stream().map(u -> {
                Map<String, Object> m = new java.util.LinkedHashMap<>();
                m.put("id",          u.getId());
                m.put("name",        u.getName());
                m.put("email",       u.getEmail());
                m.put("role",        u.getRole());
                m.put("phone",       u.getPhone());
                m.put("totpEnabled", u.isTotpEnabled());
                m.put("createdAt",   u.getCreatedAt());
                return m;
            }).toList();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ─── Admin: Delete user ───────────────────────────────────────────────────
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            if (!userRepo.existsById(id)) return ResponseEntity.notFound().build();
            userRepo.deleteById(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/status")
    public ResponseEntity<?> status() {
        return ResponseEntity.ok(Map.of("status", "ok", "service", "MediPulse Auth"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer "))
                return ResponseEntity.status(401).body(Map.of("error", "No token provided"));
            String token = authHeader.substring(7);
            String email = jwtUtil.extractEmail(token);
            return userRepo.findByEmail(email)
                .map(u -> ResponseEntity.ok(Map.of(
                    "name",  u.getName() != null ? u.getName() : "",
                    "email", u.getEmail(),
                    "role",  u.getRole(),
                    "id",    u.getId())))
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid or expired token"));
        }
    }

    private String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 2) return email;
        return email.charAt(0) + "***" + email.substring(at - 1);
    }

    // ─── Pending registration record ─────────────────────────────────────────
    private record PendingRegistration(
        String email, String name, String password, String phone,
        String role, String department, String specialization,
        String totpSecret, long expiresAt
    ) {}
}
