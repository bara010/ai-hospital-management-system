package com.hospital;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableAsync   // Required for async tasks
public class HospitalManagementApplication {
    public static void main(String[] args) {
        SpringApplication.run(HospitalManagementApplication.class, args);
        System.out.println("\n╔══════════════════════════════════════════════╗");
        System.out.println("║  ✅ MediPulse is running!                    ║");
        System.out.println("║  📡 Backend: http://localhost:8080           ║");
        System.out.println("║  🔴 Oracle DB: localhost:1521/MEDIPULSE      ║");
        System.out.println("╚══════════════════════════════════════════════╝");
        System.out.println("\n📧 EMAIL / OTP SETUP:");
        System.out.println("   Open backend/src/main/resources/application.properties");
        System.out.println("   Set spring.mail.username  = yourname@gmail.com");
        System.out.println("   Set spring.mail.password  = your16charapppassword");
        System.out.println("   Set hospital.email.from   = yourname@gmail.com");
        System.out.println("   Get App Password: https://myaccount.google.com/apppasswords");
        System.out.println("   (Enable 2-Step Verification first, then generate App Password)\n");
    }
}
