package com.hospital.service;

import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Rule-based Smart Symptom Analysis Engine.
 *
 * Maps symptom keywords → department, conditions, severity.
 * Each rule returns:
 *   - department  (which specialist to route to)
 *   - conditions  (possible diagnoses)
 *   - severity    (0-100 score)
 *   - emergency   (NORMAL | MODERATE | HIGH | CRITICAL)
 */
@Service
public class SymptomAnalysisService {

    public record AnalysisResult(
        String department,
        String predictedCondition,
        int severityScore,
        String emergencyLevel,
        List<String> recommendations
    ) {}

    // Keyword groups → department mapping (ordered by priority)
    private static final List<SymptomRule> RULES = List.of(
        // ── CARDIOLOGY ──────────────────────────────────────────────────────
        new SymptomRule("CARDIOLOGY",
            List.of("chest pain", "chest tightness", "heart pain", "palpitations",
                    "shortness of breath", "irregular heartbeat", "heart attack",
                    "angina", "cardiac", "heart failure"),
            "Possible Cardiac Condition (Angina / Myocardial Infarction)",
            80, "HIGH",
            List.of("🚨 Seek immediate medical attention",
                    "Avoid physical exertion",
                    "Chew aspirin if available and not allergic",
                    "Book emergency appointment with cardiologist")),

        // ── NEUROLOGY ───────────────────────────────────────────────────────
        new SymptomRule("NEUROLOGY",
            List.of("severe headache", "migraine", "head pain", "dizziness",
                    "vertigo", "fainting", "seizure", "confusion",
                    "memory loss", "numbness", "stroke", "paralysis", "tremor"),
            "Possible Neurological Condition (Migraine / TIA / Stroke)",
            75, "HIGH",
            List.of("🧠 Neurological symptoms need urgent evaluation",
                    "Avoid driving or operating machinery",
                    "Note time of symptom onset",
                    "Get CT scan or MRI if advised")),

        // ── OPHTHALMOLOGY ───────────────────────────────────────────────────
        new SymptomRule("OPHTHALMOLOGY",
            List.of("eye pain", "blurred vision", "vision loss", "red eye",
                    "eye discharge", "eye infection", "double vision",
                    "itchy eyes", "watery eyes", "eye swelling"),
            "Possible Eye Condition (Conjunctivitis / Refractive Error / Glaucoma)",
            45, "MODERATE",
            List.of("👁 Avoid rubbing your eyes",
                    "Do not wear contact lenses until evaluated",
                    "Protect eyes from bright light",
                    "See an eye specialist promptly")),

        // ── ENT ─────────────────────────────────────────────────────────────
        new SymptomRule("ENT",
            List.of("ear pain", "ear discharge", "hearing loss", "tinnitus",
                    "sore throat", "throat pain", "hoarseness", "nasal",
                    "sinus", "runny nose", "nosebleed", "swollen tonsils"),
            "Possible ENT Condition (Otitis Media / Sinusitis / Pharyngitis)",
            35, "MODERATE",
            List.of("🦻 Avoid inserting objects in ears",
                    "Steam inhalation may help sinus symptoms",
                    "Stay hydrated and rest",
                    "Consult ENT specialist")),

        // ── ORTHOPEDICS ─────────────────────────────────────────────────────
        new SymptomRule("ORTHOPEDICS",
            List.of("back pain", "joint pain", "knee pain", "shoulder pain",
                    "fracture", "bone pain", "muscle pain", "sprain",
                    "arthritis", "spine", "hip pain", "stiff joints", "swollen joint"),
            "Possible Musculoskeletal Condition (Arthritis / Sprain / Fracture)",
            50, "MODERATE",
            List.of("🦴 Rest the affected area",
                    "Apply ice pack for first 48 hours",
                    "Avoid heavy lifting",
                    "X-ray may be required — see orthopedic specialist")),

        // ── GASTROENTEROLOGY ────────────────────────────────────────────────
        new SymptomRule("GASTROENTEROLOGY",
            List.of("stomach pain", "abdominal pain", "nausea", "vomiting",
                    "diarrhea", "constipation", "bloating", "acid reflux",
                    "heartburn", "indigestion", "gastric", "liver", "jaundice"),
            "Possible Gastrointestinal Condition (Gastritis / IBS / GERD)",
            40, "MODERATE",
            List.of("🫁 Eat light, easily digestible food",
                    "Stay hydrated — oral rehydration if diarrhea",
                    "Avoid spicy, oily foods",
                    "Consult gastroenterologist if symptoms persist")),

        // ── PULMONOLOGY ─────────────────────────────────────────────────────
        new SymptomRule("PULMONOLOGY",
            List.of("cough", "persistent cough", "breathing difficulty",
                    "wheezing", "breathlessness", "asthma", "pneumonia",
                    "tuberculosis", "blood in cough", "chest congestion"),
            "Possible Respiratory Condition (Asthma / Bronchitis / Pneumonia)",
            60, "HIGH",
            List.of("💨 Use prescribed inhaler if asthmatic",
                    "Avoid dust and smoke",
                    "Pursue chest X-ray",
                    "Pulmonologist consultation recommended")),

        // ── DERMATOLOGY ─────────────────────────────────────────────────────
        new SymptomRule("DERMATOLOGY",
            List.of("rash", "skin rash", "itching", "skin irritation",
                    "eczema", "psoriasis", "acne", "hives", "blisters",
                    "skin infection", "hair loss", "skin lesion", "fungal"),
            "Possible Dermatological Condition (Eczema / Dermatitis / Fungal Infection)",
            30, "NORMAL",
            List.of("🩹 Avoid scratching the affected area",
                    "Keep skin clean and moisturized",
                    "Avoid known allergens",
                    "Dermatologist appointment advised")),

        // ── ENDOCRINOLOGY / GENERAL ─────────────────────────────────────────
        new SymptomRule("ENDOCRINOLOGY",
            List.of("diabetes", "high blood sugar", "excessive thirst",
                    "frequent urination", "weight gain", "weight loss",
                    "thyroid", "hormonal", "fatigue", "excessive fatigue"),
            "Possible Endocrine Condition (Diabetes / Thyroid Disorder)",
            45, "MODERATE",
            List.of("🩸 Monitor blood sugar regularly",
                    "Maintain balanced diet low in sugar",
                    "Stay physically active",
                    "Consult endocrinologist for hormone testing")),

        // ── UROLOGY ─────────────────────────────────────────────────────────
        new SymptomRule("UROLOGY",
            List.of("urinary pain", "burning urination", "frequent urination",
                    "kidney pain", "blood in urine", "uti", "urinary infection",
                    "bladder", "prostate", "kidney stone"),
            "Possible Urological Condition (UTI / Kidney Stone / Prostatitis)",
            55, "HIGH",
            List.of("💧 Drink plenty of water",
                    "Avoid caffeine and alcohol",
                    "Complete antibiotic course if prescribed",
                    "Urology consultation and urine culture needed")),

        // ── PSYCHIATRY ──────────────────────────────────────────────────────
        new SymptomRule("PSYCHIATRY",
            List.of("anxiety", "depression", "panic attack", "insomnia",
                    "mental health", "stress", "mood swings", "hallucination",
                    "suicidal thoughts", "phobia", "ocd", "ptsd"),
            "Possible Mental Health Condition (Anxiety / Depression / Mood Disorder)",
            65, "HIGH",
            List.of("🧘 Reach out to a trusted person immediately",
                    "Mindfulness and breathing exercises can help",
                    "Avoid alcohol and substance use",
                    "Urgent psychiatric evaluation recommended")),

        // ── DENTISTRY ───────────────────────────────────────────────────────
        new SymptomRule("DENTISTRY",
            List.of("tooth pain", "toothache", "gum pain", "bleeding gums",
                    "dental", "jaw pain", "mouth ulcer", "swollen gum", "cavity"),
            "Possible Dental Condition (Caries / Periodontitis / Abscess)",
            35, "MODERATE",
            List.of("🦷 Rinse with warm salt water",
                    "Avoid very hot or cold foods",
                    "Take OTC pain relief if needed",
                    "See a dentist as soon as possible")),

        // ── GENERAL PHYSICIAN (fallback) ─────────────────────────────────────
        new SymptomRule("GENERAL_MEDICINE",
            List.of("fever", "cold", "flu", "weakness", "body ache",
                    "chills", "loss of appetite", "general", "tiredness",
                    "mild headache", "sneezing"),
            "Possible General Illness (Viral Fever / Flu / Fatigue)",
            25, "NORMAL",
            List.of("🌡 Rest and stay hydrated",
                    "Take paracetamol for fever",
                    "Monitor temperature",
                    "See General Physician if symptoms worsen"))
    );

    /**
     * Analyze patient symptoms and return structured result.
     *
     * @param symptoms        comma-separated symptom string
     * @param age             patient age
     * @param weightKg        patient weight
     * @param existingDiseases comma-separated existing conditions
     */
    public AnalysisResult analyze(String symptoms, int age, double weightKg, String existingDiseases) {
        if (symptoms == null || symptoms.isBlank()) {
            return new AnalysisResult(
                "GENERAL_MEDICINE",
                "No specific symptoms reported. Routine health check recommended.",
                10, "NORMAL",
                List.of("💡 Schedule a routine check-up with a General Physician")
            );
        }

        String lowerSymptoms = symptoms.toLowerCase();
        String lowerDiseases = (existingDiseases != null ? existingDiseases : "").toLowerCase();

        // Score each rule by keyword matches
        SymptomRule bestRule = null;
        int bestScore = 0;

        for (SymptomRule rule : RULES) {
            int matches = 0;
            for (String kw : rule.keywords()) {
                if (lowerSymptoms.contains(kw)) matches++;
            }
            if (matches > bestScore) {
                bestScore = matches;
                bestRule = rule;
            }
        }

        // Default to general medicine if no match
        if (bestRule == null || bestScore == 0) {
            bestRule = RULES.get(RULES.size() - 1); // last = general medicine
        }

        // Adjust severity based on age and existing diseases
        int adjustedSeverity = bestRule.baseSeverity();
        if (age > 60) adjustedSeverity = Math.min(100, adjustedSeverity + 15);
        if (age < 5)  adjustedSeverity = Math.min(100, adjustedSeverity + 10);
        if (lowerDiseases.contains("diabetes"))     adjustedSeverity = Math.min(100, adjustedSeverity + 10);
        if (lowerDiseases.contains("hypertension") || lowerDiseases.contains("bp"))
            adjustedSeverity = Math.min(100, adjustedSeverity + 10);
        if (lowerDiseases.contains("heart"))        adjustedSeverity = Math.min(100, adjustedSeverity + 15);

        // BMI-based adjustment
        if (weightKg > 0 && age > 0) {
            // crude height estimate: 1.65m avg — just for BMI flag
            double estimatedBMI = weightKg / (1.65 * 1.65);
            if (estimatedBMI > 30) adjustedSeverity = Math.min(100, adjustedSeverity + 5);
        }

        // Determine emergency level from adjusted severity
        String emergencyLevel;
        if (adjustedSeverity >= 75)      emergencyLevel = "CRITICAL";
        else if (adjustedSeverity >= 55) emergencyLevel = "HIGH";
        else if (adjustedSeverity >= 35) emergencyLevel = "MODERATE";
        else                             emergencyLevel = "NORMAL";

        return new AnalysisResult(
            bestRule.department(),
            bestRule.condition(),
            adjustedSeverity,
            emergencyLevel,
            bestRule.recommendations()
        );
    }

    /** Map department code → human-readable label */
    public static String deptLabel(String dept) {
        return switch (dept != null ? dept.toUpperCase() : "") {
            case "CARDIOLOGY"       -> "Heart Specialist (Cardiology)";
            case "NEUROLOGY"        -> "Brain & Nerve Specialist (Neurology)";
            case "OPHTHALMOLOGY"    -> "Eye Specialist (Ophthalmology)";
            case "ENT"              -> "Ear, Nose & Throat (ENT)";
            case "ORTHOPEDICS","ORTHOPAEDICS" -> "Bone & Joint Specialist (Orthopedics)";
            case "GASTROENTEROLOGY" -> "Digestive System Specialist (Gastroenterology)";
            case "PULMONOLOGY"      -> "Lung Specialist (Pulmonology)";
            case "DERMATOLOGY"      -> "Skin Specialist (Dermatology)";
            case "ENDOCRINOLOGY"    -> "Hormone Specialist (Endocrinology)";
            case "UROLOGY"          -> "Urinary System Specialist (Urology)";
            case "PSYCHIATRY"       -> "Mental Health Specialist (Psychiatry)";
            case "DENTISTRY"        -> "Dentist (Oral Health)";
            case "PAEDIATRICS","PEDIATRICS" -> "Child Specialist (Paediatrics)";
            case "GENERAL_MEDICINE","GENERAL" -> "General Physician";
            default                 -> "General Physician";
        };
    }

    // ── Inner helper record ──────────────────────────────────────────────────
    private record SymptomRule(
        String department,
        List<String> keywords,
        String condition,
        int baseSeverity,
        String emergencyLevel,
        List<String> recommendations
    ) {}
}
