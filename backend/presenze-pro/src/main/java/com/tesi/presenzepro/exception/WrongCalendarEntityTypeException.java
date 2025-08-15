package com.tesi.presenzepro.exception;

public class WrongCalendarEntityTypeException extends RuntimeException{
    public WrongCalendarEntityTypeException(String entryType){
        super("Wrong entry type: " + entryType);
    }
}
