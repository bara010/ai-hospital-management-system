package com.hospito.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.nio.file.Files;
import java.nio.file.Path;

@Configuration
public class FirebaseConfig {

    @Value("${fcm.service-account-path:}")
    private String serviceAccountPath;

    @PostConstruct
    public void initializeFirebase() {
        if (serviceAccountPath == null || serviceAccountPath.isBlank()) {
            return;
        }

        if (!FirebaseApp.getApps().isEmpty()) {
            return;
        }

        try {
            Path path = Path.of(serviceAccountPath).toAbsolutePath().normalize();
            if (!Files.exists(path)) {
                return;
            }

            try (FileInputStream stream = new FileInputStream(path.toFile())) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(stream))
                        .build();
                FirebaseApp.initializeApp(options);
            }
        } catch (Exception ignored) {
            // FCM is optional. System continues with in-app notifications.
        }
    }
}
