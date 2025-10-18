package com.tesi.presenzepro.project.exception;

public class NoProjectFound extends RuntimeException{
    public NoProjectFound(String name) {
        super("No project found with name: " + name);
    }
}
