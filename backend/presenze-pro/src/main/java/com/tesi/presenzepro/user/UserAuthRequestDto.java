package com.tesi.presenzepro.user;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Identificativo utente per autenticazione")
public record UserAuthRequestDto(
        String name,
        String surname,
        String email,
        String password
) {

}
