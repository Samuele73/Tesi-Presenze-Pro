package com.tesi.presenzepro.calendar.controller;

import com.tesi.presenzepro.calendar.dto.CalendarResponseEntry;
import com.tesi.presenzepro.calendar.dto.SaveCalendarEntryDto;
import com.tesi.presenzepro.calendar.model.CalendarEntity;
import com.tesi.presenzepro.calendar.service.CalendarService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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

//    @Operation(description = "Salva una nuova entry nel calendario")
//    @PostMapping("/prova")
//    ResponseEntity<?> saveNewEntry(@RequestBody Calendar calendarData){
//        service.saveNewCalendarEntry(calendarData);
//        return ResponseEntity.ok().build();
//    }

    @Operation(description = "Ottieni tutte le entries del calendario dell'utente indciato")
    @GetMapping("/getAllEntries")
    ResponseEntity<?> getAllEntries(HttpServletRequest request){
        final List<CalendarResponseEntry> calendarEntries = service.getAllUserEntries(request);
        return ResponseEntity.status(HttpStatus.OK).body(calendarEntries);
    }

    @GetMapping("/getByMonthYearEntries")
    ResponseEntity<?> getEntriesByMonthYear(HttpServletRequest request ,@RequestParam String month, @RequestParam String year){
        final List<CalendarResponseEntry> calendarEntries = service.getUserEntriesByMonthYear(request ,Integer.parseInt(month), Integer.parseInt(year));
        return ResponseEntity.status(HttpStatus.OK).body(calendarEntries);
    }

    @PostMapping("/saveCalendarEntry")
    ResponseEntity<?> saveEntry(@RequestBody CalendarEntity calendarEntityEntry){
        final CalendarEntity savedCalendarEntityEntry = service.saveNewCalendarEntry(calendarEntityEntry);
        SaveCalendarEntryDto responseBody = new SaveCalendarEntryDto(
                savedCalendarEntityEntry.getUserEmail(),
                savedCalendarEntityEntry.getEntryType(),
                savedCalendarEntityEntry.getCalendarEntry()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
    }

    @Operation(description = "modifica una entry nel calendario dell'utente (n.b: da finire)")
    @PutMapping("/modifyEntries")
    ResponseEntity<?> modifyEntries(){
        System.out.println("Mofifica entries in corso: ");
        return ResponseEntity.ok().build();
    }
}
