package com.tesi.presenzepro.exception;

public class CalendarEntityNotFoundException extends RuntimeException {
    public CalendarEntityNotFoundException(String id) {
        super("Risorsa del calendario non trovata");
    }
}
