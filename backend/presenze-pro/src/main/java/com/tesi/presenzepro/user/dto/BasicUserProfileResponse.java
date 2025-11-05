package com.tesi.presenzepro.user.dto;

public record BasicUserProfileResponse(
        String name,
        String surname,
        String email
) {
}
