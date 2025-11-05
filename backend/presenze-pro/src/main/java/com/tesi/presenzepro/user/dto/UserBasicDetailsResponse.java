package com.tesi.presenzepro.user.dto;

import com.tesi.presenzepro.user.model.Role;

public record UserBasicDetailsResponse(
        String name,
        String surname,
        String email,
        String duty,
        Role role
) {
}
