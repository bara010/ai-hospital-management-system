package com.hospito.service;

import com.hospito.dto.AiSymptomRequest;
import com.hospito.dto.AiSymptomResponse;
import com.hospito.dto.DoctorCardResponse;
import com.hospito.exception.BadRequestException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class AiHealthAssistantService {

    private final DoctorService doctorService;

    public AiHealthAssistantService(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    public AiSymptomResponse analyzeSymptoms(AiSymptomRequest request) {
        String symptoms = request == null || request.getSymptoms() == null ? "" : request.getSymptoms().trim();
        if (symptoms.isBlank()) {
            throw new BadRequestException("Symptoms are required");
        }

        String normalized = symptoms.toLowerCase(Locale.ROOT);
        Recommendation recommendation = infer(normalized);

        List<DoctorCardResponse> doctors = doctorService.listApprovedDoctors(recommendation.specialization()).stream()
                .sorted(Comparator.comparing((DoctorCardResponse d) -> d.rating() == null ? BigDecimal.ZERO : d.rating()).reversed())
                .limit(6)
                .toList();

        AiSymptomResponse response = new AiSymptomResponse();
        response.setRecommendedSpecialization(recommendation.specialization());
        response.setAdvice(recommendation.advice());
        response.setPossibleConditions(recommendation.conditions());
        response.setRecommendedDoctors(doctors);
        return response;
    }

    private Recommendation infer(String input) {
        if (containsAny(input, "chest pain", "palpitation", "heart", "shortness of breath", "breathless")) {
            return new Recommendation(
                    "Cardiology",
                    "Cardiac symptoms need timely in-person evaluation. Book a cardiologist promptly.",
                    List.of("Possible cardiac strain", "Arrhythmia", "Hypertension-related discomfort")
            );
        }

        if (containsAny(input, "rash", "itch", "skin", "acne", "eczema")) {
            return new Recommendation(
                    "Dermatology",
                    "Skin symptoms are best triaged by a dermatologist with visual assessment.",
                    List.of("Allergic dermatitis", "Fungal infection", "Inflammatory skin condition")
            );
        }

        if (containsAny(input, "stomach", "nausea", "vomit", "diarrhea", "acid", "gastric", "abdominal")) {
            return new Recommendation(
                    "Gastroenterology",
                    "Hydrate and avoid irritant food until specialist review.",
                    List.of("Gastroenteritis", "Acidity/GERD", "Digestive inflammation")
            );
        }

        if (containsAny(input, "joint", "knee", "back pain", "neck pain", "shoulder", "sprain", "fracture")) {
            return new Recommendation(
                    "Orthopedics",
                    "Rest the affected region and seek orthopedic assessment.",
                    List.of("Musculoskeletal strain", "Ligament inflammation", "Degenerative joint pain")
            );
        }

        if (containsAny(input, "anxiety", "depression", "panic", "stress", "insomnia", "sleep")) {
            return new Recommendation(
                    "Psychiatry",
                    "Mental health symptoms are manageable with early support.",
                    List.of("Anxiety spectrum", "Stress reaction", "Sleep disorder")
            );
        }

        if (containsAny(input, "eye", "vision", "blurry", "red eye", "watering")) {
            return new Recommendation(
                    "Ophthalmology",
                    "Avoid eye strain and get a focused eye exam soon.",
                    List.of("Conjunctival irritation", "Refractive issue", "Eye infection")
            );
        }

        if (containsAny(input, "headache", "fever", "cough", "cold", "body pain", "weakness", "viral")) {
            return new Recommendation(
                    "General Physician",
                    "Monitor hydration and temperature; consult a physician for persistent symptoms.",
                    List.of("Viral infection", "Upper respiratory infection", "General inflammation")
            );
        }

        return new Recommendation(
                "General Physician",
                "Start with a general physician for complete triage and referral.",
                List.of("Non-specific clinical syndrome")
        );
    }

    private boolean containsAny(String value, String... terms) {
        for (String term : terms) {
            if (value.contains(term)) {
                return true;
            }
        }
        return false;
    }

    private record Recommendation(String specialization, String advice, List<String> conditions) {
    }
}


