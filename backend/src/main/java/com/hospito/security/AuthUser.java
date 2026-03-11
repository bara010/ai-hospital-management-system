package com.hospito.security;

import com.hospito.entity.Role;

public class AuthUser {
    private final Long id;
    private final String email;
    private final Role role;

    public AuthUser(Long id, String email, Role role) {
        this.id = id;
        this.email = email;
        this.role = role;
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public Role getRole() {
        return role;
    }
}
