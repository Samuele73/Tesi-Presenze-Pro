package com.tesi.presenzepro.project.exception;

public class NoUserForProjectFound extends RuntimeException{
    public NoUserForProjectFound(String email){
        super("Assigned user was not found: " + email);
    }
}
