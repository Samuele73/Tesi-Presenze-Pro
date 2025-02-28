package com.tesi.presenzepro.calendar;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.Response;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/calendar")
@CrossOrigin(origins = "http://localhost:4200")
public class CalendarController {
    private final CalendarService service;

    @PostMapping("/prova")
    ResponseEntity<?> saveNewEntry(@RequestBody Calendar calendarData){
        service.saveNewCalendarEntry(calendarData);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/retrieveAll")
    ResponseEntity<?> retrieveAllEntries(HttpServletRequest request){
        final List<CalendarResponseEntry> calendarEntries = service.retrieveAllUserEntries(request);
        if(calendarEntries == null)
            return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(calendarEntries);
    }

    @PutMapping("/modifyEntries")
    ResponseEntity<?> modifyEntries(){
        System.out.println("Mofifica entries in corso: ");
        return ResponseEntity.ok().build();
    }
}
