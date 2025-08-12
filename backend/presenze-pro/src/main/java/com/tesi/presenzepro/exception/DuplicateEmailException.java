package com.tesi.presenzepro.exception;

public class DuplicateEmailException extends RuntimeException {
    public DuplicateEmailException(String email) {
        super("Email già registrata: " + email);
    }
}
