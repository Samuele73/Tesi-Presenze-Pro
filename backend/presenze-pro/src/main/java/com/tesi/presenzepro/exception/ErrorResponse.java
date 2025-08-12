package com.tesi.presenzepro.exception;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@AllArgsConstructor
@Data
public class ErrorResponse {
    private LocalDateTime timestamp;
    private String message;
    private String details;
}
