package com.hospito.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LabOrderResultUpdateRequest(
        @NotBlank @Size(max = 4000) String resultSummary,
        @Size(max = 350) String resultFilePath
) {
}
