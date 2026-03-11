package com.hospito.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
public class TotpService {

    private final String issuer;
    private final DefaultSecretGenerator secretGenerator;
    private final CodeVerifier codeVerifier;

    public TotpService(@Value("${hospito.totp.issuer}") String issuer) {
        this.issuer = issuer;
        this.secretGenerator = new DefaultSecretGenerator();
        this.codeVerifier = new DefaultCodeVerifier(
                new DefaultCodeGenerator(),
                new SystemTimeProvider()
        );
    }

    public String generateSecret() {
        return secretGenerator.generate();
    }

    public boolean verifyCode(String secret, String code) {
        return codeVerifier.isValidCode(secret, code);
    }

    public String buildOtpAuthUrl(String email, String secret) {
        String encodedIssuer = URLEncoder.encode(issuer, StandardCharsets.UTF_8);
        String encodedLabel = URLEncoder.encode(issuer + ":" + email, StandardCharsets.UTF_8);
        return "otpauth://totp/" + encodedLabel + "?secret=" + secret + "&issuer=" + encodedIssuer;
    }

    public String generateQrCodeDataUrl(String content) {
        try {
            BitMatrix matrix = new MultiFormatWriter().encode(content, BarcodeFormat.QR_CODE, 280, 280);
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", output);
            String base64 = Base64.getEncoder().encodeToString(output.toByteArray());
            return "data:image/png;base64," + base64;
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to generate QR code", ex);
        }
    }
}
