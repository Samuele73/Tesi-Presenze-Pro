package com.tesi.presenzepro.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Risposta per le richieste di autenticazione utente")
public record UserAuthResponseDto(
        String token
) {

}
