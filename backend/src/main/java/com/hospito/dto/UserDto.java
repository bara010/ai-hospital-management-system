package com.hospito.dto;

import com.hospito.entity.Role;

public record UserDto(
        Long id,
        String email,
        String firstName,
        String lastName,
        String phone,
        Role role
) {
}
