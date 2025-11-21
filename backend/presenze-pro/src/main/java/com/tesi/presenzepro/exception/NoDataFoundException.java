package com.tesi.presenzepro.exception;

public class NoDataFoundException extends RuntimeException {
    public NoDataFoundException(String id) {
        super("Risorsa del calendario non trovata");
    }
}
