package com.tesi.presenzepro.calendar.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Azione di approvazione eseguibile su una richiesta (usata dagli admin e owner)", enumAsRef = true)
public enum ApprovalAction {
    ACCEPT,
    REJECT
}
