package com.tesi.presenzepro.user;

public record UserAuthRequestDto(
        String name,
        String surname,
        String email,
        String password
) {

}
