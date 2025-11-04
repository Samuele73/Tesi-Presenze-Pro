package com.tesi.presenzepro.user.exception;

public class UserTokenNotValidException extends RuntimeException {
    public UserTokenNotValidException(String message) {
        super(message);
    }
}
