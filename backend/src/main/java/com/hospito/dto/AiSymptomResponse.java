package com.hospito.dto;

import java.util.List;

public class AiSymptomResponse {
    private String recommendedSpecialization;
    private String advice;
    private List<String> possibleConditions;
    private List<DoctorCardResponse> recommendedDoctors;

    public String getRecommendedSpecialization() {
        return recommendedSpecialization;
    }

    public void setRecommendedSpecialization(String recommendedSpecialization) {
        this.recommendedSpecialization = recommendedSpecialization;
    }

    public String getAdvice() {
        return advice;
    }

    public void setAdvice(String advice) {
        this.advice = advice;
    }

    public List<String> getPossibleConditions() {
        return possibleConditions;
    }

    public void setPossibleConditions(List<String> possibleConditions) {
        this.possibleConditions = possibleConditions;
    }

    public List<DoctorCardResponse> getRecommendedDoctors() {
        return recommendedDoctors;
    }

    public void setRecommendedDoctors(List<DoctorCardResponse> recommendedDoctors) {
        this.recommendedDoctors = recommendedDoctors;
    }
}
