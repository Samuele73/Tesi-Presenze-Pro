package com.tesi.presenzepro.calendar.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Indica se le richieste che vengono ricercate devono esssere aperte o chiuse", enumAsRef = true)
public enum ApprovalRequestTab {
    OPEN,
    CLOSED
}
