package com.hospital.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import dev.samstevens.totp.code.*;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * GoogleTotpService — Google Authenticator TOTP (RFC 6238).
 *
 * Flow:
 *  1. generateSecret()       — generate a new Base32 secret for a user
 *  2. getQrCodeDataUri()     — return a base64 PNG data URI to display as QR code
 *  3. verifyCode()           — verify the 6-digit code from Google Authenticator
 *
 * No email needed — the user scans the QR once and uses the app forever.
 */
@Service
public class GoogleTotpService {

    private static final String ISSUER = "MediPulse";

    private final SecretGenerator secretGenerator = new DefaultSecretGenerator();
    private final TimeProvider timeProvider = new SystemTimeProvider();
    private final CodeGenerator codeGenerator = new DefaultCodeGenerator();
    private final CodeVerifier codeVerifier;

    public GoogleTotpService() {
        DefaultCodeVerifier verifier = new DefaultCodeVerifier(codeGenerator, timeProvider);
        verifier.setTimePeriod(30);     // 30-second window
        verifier.setAllowedTimePeriodDiscrepancy(1); // allow 1 window before/after for clock skew
        this.codeVerifier = verifier;
    }

    /** Generate a new 32-character Base32 TOTP secret */
    public String generateSecret() {
        return secretGenerator.generate();
    }

    /**
     * Build a Google Authenticator otpauth:// URI and return a base64-encoded
     * PNG QR code as a data URI string (e.g. "data:image/png;base64,...")
     * ready to drop directly into an <img src="..."> tag.
     */
    public String getQrCodeDataUri(String email, String secret) {
        try {
            String label   = URLEncoder.encode(ISSUER + ":" + email, StandardCharsets.UTF_8);
            String issuerE = URLEncoder.encode(ISSUER, StandardCharsets.UTF_8);
            String uri = "otpauth://totp/" + label
                    + "?secret=" + secret
                    + "&issuer=" + issuerE
                    + "&algorithm=SHA1"
                    + "&digits=6"
                    + "&period=30";

            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(uri, BarcodeFormat.QR_CODE, 250, 250);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", baos);
            String b64 = Base64.getEncoder().encodeToString(baos.toByteArray());
            return "data:image/png;base64," + b64;
        } catch (WriterException | java.io.IOException e) {
            System.err.println("[GoogleTotpService] QR generation failed: " + e.getMessage());
            return null;
        }
    }

    /**
     * Verify a 6-digit TOTP code against the stored secret.
     * Returns true if valid.
     */
    public boolean verifyCode(String secret, String code) {
        if (secret == null || code == null || code.isBlank()) return false;
        try {
            return codeVerifier.isValidCode(secret, code.trim());
        } catch (Exception e) {
            System.err.println("[GoogleTotpService] Verification error: " + e.getMessage());
            return false;
        }
    }
}
