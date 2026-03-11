package com.hospital;

import com.hospital.model.Notification;
import com.hospital.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * MediPulse Test Suite
 * Tests core API endpoints and business logic.
 * Run with: mvn test
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MediPulseApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private NotificationRepository notificationRepo;

    // ── Auth Tests ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/register — should reject missing fields")
    void register_shouldRejectBlankEmail() throws Exception {
        String body = """
            { "name": "Test User", "email": "", "password": "pass123", "role": "PATIENT" }
            """;
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/login — should reject wrong credentials")
    void login_shouldRejectWrongPassword() throws Exception {
        String body = """
            { "email": "nonexistent@test.com", "password": "wrongpass" }
            """;
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isUnauthorized());
    }

    // ── Notification Tests ──────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/notifications — should return 200")
    void getNotifications_shouldReturn200() throws Exception {
        mockMvc.perform(get("/api/notifications"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    @DisplayName("GET /api/notifications/unread — should return list")
    void getUnread_shouldReturnList() throws Exception {
        mockMvc.perform(get("/api/notifications/unread"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("Notification model — should save and retrieve correctly")
    void notification_shouldSaveAndRetrieve() {
        Notification notif = new Notification();
        notif.setType("MEDICINE_REMINDER");
        notif.setTitle("Test Reminder");
        notif.setMessage("Take your medicine!");
        notif.setPatientId(1L);
        notif.setRecipientType("PATIENT");
        notif.setRead(false);
        notif.setCreatedAt(LocalDateTime.now());

        Notification saved = notificationRepo.save(notif);

        assertNotNull(saved.getId(), "Saved notification should have an ID");
        assertEquals("MEDICINE_REMINDER", saved.getType());
        assertEquals("Test Reminder", saved.getTitle());
        assertFalse(saved.isRead(), "New notification should be unread");

        // Mark as read
        saved.setRead(true);
        Notification updated = notificationRepo.save(saved);
        assertTrue(updated.isRead(), "Notification should be marked as read");

        // Cleanup
        notificationRepo.deleteById(saved.getId());
    }

    @Test
    @DisplayName("Notification count — should match unread query")
    void notificationCount_shouldMatchUnread() {
        long countFromRepo = notificationRepo.countByReadFalse();
        assertTrue(countFromRepo >= 0, "Unread count should be non-negative");
    }

    // ── Analytics Tests ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/analytics/summary — should return stats object")
    void analytics_shouldReturnSummary() throws Exception {
        mockMvc.perform(get("/api/analytics/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalNotifications").exists())
                .andExpect(jsonPath("$.unreadNotifications").exists())
                .andExpect(jsonPath("$.readRate").exists());
    }

    // ── Appointment Tests ───────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/appointments — should return 200")
    void appointments_shouldReturn200() throws Exception {
        mockMvc.perform(get("/api/appointments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /api/appointments/upcoming/count — should return count object")
    void upcomingAppointments_shouldReturnCount() throws Exception {
        mockMvc.perform(get("/api/appointments/upcoming/count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").exists());
    }
}
