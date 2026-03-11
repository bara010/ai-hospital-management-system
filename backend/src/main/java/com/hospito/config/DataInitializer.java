package com.hospito.config;

import com.hospito.entity.Role;
import com.hospito.entity.User;
import com.hospito.repository.UserRepository;
import com.hospito.service.TotpService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner seedAdmin(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            TotpService totpService,
            @Value("${hospito.admin.email:admin@hospito.com}") String adminEmail,
            @Value("${hospito.admin.password:Admin@12345}") String adminPassword,
            @Value("${hospito.admin.first-name:System}") String adminFirstName,
            @Value("${hospito.admin.last-name:Admin}") String adminLastName,
            @Value("${hospito.admin.totp-secret:}") String adminTotpSecret
    ) {
        return args -> {
            if (userRepository.existsByEmailIgnoreCase(adminEmail)) {
                return;
            }

            User admin = new User();
            admin.setEmail(adminEmail.toLowerCase());
            admin.setPasswordHash(passwordEncoder.encode(adminPassword));
            admin.setFirstName(adminFirstName);
            admin.setLastName(adminLastName);
            admin.setRole(Role.ADMIN);
            admin.setEnabled(true);
            admin.setTotpEnabled(true);
            admin.setTotpSecret(adminTotpSecret == null || adminTotpSecret.isBlank()
                    ? totpService.generateSecret()
                    : adminTotpSecret);

            userRepository.save(admin);
        };
    }
}
