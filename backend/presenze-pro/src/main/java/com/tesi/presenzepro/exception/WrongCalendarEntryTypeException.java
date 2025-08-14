package com.tesi.presenzepro.exception;

public class WrongCalendarEntryTypeException extends RuntimeException{
    public WrongCalendarEntryTypeException(String entryType){
        super("Wrong entry type: " + entryType);
    }
}
