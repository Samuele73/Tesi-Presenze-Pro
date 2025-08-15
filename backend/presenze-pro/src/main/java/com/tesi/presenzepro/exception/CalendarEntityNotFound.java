package com.tesi.presenzepro.exception;

public class CalendarEntityNotFound extends RuntimeException {
    public CalendarEntityNotFound(String id) {
        super("Risorsa del calendario non trovata");
    }
}
