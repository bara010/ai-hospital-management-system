package com.hospito.dto;

public class AiSummaryResponse {
    private String summary;
    private String keyFindings;

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getKeyFindings() {
        return keyFindings;
    }

    public void setKeyFindings(String keyFindings) {
        this.keyFindings = keyFindings;
    }
}
