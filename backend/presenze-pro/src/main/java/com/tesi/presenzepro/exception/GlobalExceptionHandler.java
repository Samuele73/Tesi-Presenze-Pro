package com.tesi.presenzepro.exception;

import com.tesi.presenzepro.project.exception.NoUserForProjectFound;
import com.tesi.presenzepro.user.exception.UserNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.time.LocalDateTime;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateEmail(DuplicateEmailException ex) {
        ErrorResponse errorResponse = new ErrorResponse(LocalDateTime.now(), ex.getMessage(), "The email is already in use");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
    }

    @ExceptionHandler(WrongCalendarEntityTypeException.class)
    public ResponseEntity<ErrorResponse> handleWrongCalendarEntryType(WrongCalendarEntityTypeException ex) {
        ErrorResponse errorResponse = new ErrorResponse(LocalDateTime.now(), ex.getMessage(), "Wrong entry type");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(CalendarEntityNotFound.class)
    public ResponseEntity<ErrorResponse> handleCalendarEntityNotFound(WrongCalendarEntityTypeException ex) {
        ErrorResponse errorResponse = new ErrorResponse(LocalDateTime.now(), ex.getMessage(), "Calendar entity not found");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, Object> handleNoHandlerFound(NoHandlerFoundException ex) {
        return Map.of(
                "status", HttpStatus.NOT_FOUND.value(),
                "error", "Not Found",
                "message", "The requested endpoint does not exist",
                "path", ex.getRequestURL()
        );
    }

    @ExceptionHandler(NoUserForProjectFound.class)
    public ResponseEntity<ErrorResponse> handleUserNotFound(NoUserForProjectFound ex) {
        ErrorResponse errorResponse = new ErrorResponse(LocalDateTime.now(), ex.getMessage(), "Assigned user not found");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

//    @ExceptionHandler(Exception.class)
//    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
//        ErrorResponse errorResponse = new ErrorResponse(LocalDateTime.now(), ex.getMessage(), "A generic server error occured");
//        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                .body(errorResponse);
//    }

}
