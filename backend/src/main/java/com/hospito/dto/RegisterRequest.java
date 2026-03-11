package com.hospito.dto;

import com.hospito.entity.Role;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank @Size(max = 100) String firstName,
        @NotBlank @Size(max = 100) String lastName,
        @Size(max = 20) String phone,
        @NotNull Role role,
        @Size(max = 150) String specialization,
        @Size(max = 200) String qualification,
        @Min(0) @Max(60) Integer yearsExperience,
        LocalDate dateOfBirth,
        @Size(max = 5) String bloodGroup,
        @Size(max = 500) String address,
        @Size(max = 1000) String allergies,
        @Size(max = 120) String emergencyContactName,
        @Size(max = 20) String emergencyContactPhone
) {
}
