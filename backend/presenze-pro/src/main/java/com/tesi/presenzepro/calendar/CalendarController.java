package com.tesi.presenzepro.calendar;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Calendario", description = "Operazioni relative al calendario")
public class CalendarController {
    private final CalendarService service;

    @Operation(description = "Salva una nuova entry nel calendario")
    @PostMapping("/prova")
    ResponseEntity<?> saveNewEntry(@RequestBody Calendar calendarData){
        service.saveNewCalendarEntry(calendarData);
        return ResponseEntity.ok().build();
    }

    @Operation(description = "Ottieni tutte le entries del calendario dell'utente indciato")
    @GetMapping("/retrieveAll")
    ResponseEntity<?> retrieveAllEntries(HttpServletRequest request){
        final List<CalendarResponseEntry> calendarEntries = service.retrieveAllUserEntries(request);
        if(calendarEntries == null)
            return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(calendarEntries);
    }

    @Operation(description = "modifica una entry nel calendario dell'utente (n.b: da finire)")
    @PutMapping("/modifyEntries")
    ResponseEntity<?> modifyEntries(){
        System.out.println("Mofifica entries in corso: ");
        return ResponseEntity.ok().build();
    }
}
