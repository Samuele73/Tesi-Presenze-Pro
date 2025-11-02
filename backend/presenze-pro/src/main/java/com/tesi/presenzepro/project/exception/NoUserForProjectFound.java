package com.tesi.presenzepro.project.exception;

public class NoUserForProjectFound extends RuntimeException{
    public NoUserForProjectFound(String message) {
        super(message);
    }
}
