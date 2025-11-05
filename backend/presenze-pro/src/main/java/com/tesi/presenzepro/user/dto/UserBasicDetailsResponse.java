package com.tesi.presenzepro.user.dto;

public record UserBasicDetailsResponse(
        String name,
        String surname,
        String email,
        String duty
) {
}
