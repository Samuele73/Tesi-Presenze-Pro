package com.tesi.presenzepro.calendar.controller;

import com.tesi.presenzepro.calendar.dto.CalendarResponseEntry;
import com.tesi.presenzepro.calendar.dto.SaveCalendarEntryDto;
import com.tesi.presenzepro.calendar.model.CalendarEntity;
import com.tesi.presenzepro.calendar.model.CalendarEntry;
import com.tesi.presenzepro.calendar.service.CalendarService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServlet;
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
    private final CalendarService calendarService;

    @Operation(description = "Obtain all entries from the provided user")
    @GetMapping("/getAllEntries")
    ResponseEntity<?> getAllEntries(HttpServletRequest request){
        final List<CalendarResponseEntry> calendarEntries = calendarService.getAllUserEntries(request);
        return ResponseEntity.status(HttpStatus.OK).body(calendarEntries);
    }

    @Operation(description = "Obtain all user calendar entries from specific month and year")
    @GetMapping("/getByMonthYearEntries")
    ResponseEntity<?> getEntriesByMonthYear(HttpServletRequest request ,@RequestParam String month, @RequestParam String year){
        final List<CalendarResponseEntry> calendarEntries = calendarService.getUserEntriesByMonthYear(request ,Integer.parseInt(month), Integer.parseInt(year));
        return ResponseEntity.status(HttpStatus.OK).body(calendarEntries);
    }

    @Operation(description = "Save a new calendar entry")
    @PostMapping("/saveCalendarEntry")
    ResponseEntity<?> saveEntry(@RequestBody CalendarEntity calendarEntityEntry){
        final CalendarEntity savedCalendarEntityEntry = calendarService.saveNewCalendarEntry(calendarEntityEntry);
        SaveCalendarEntryDto responseBody = new SaveCalendarEntryDto(
                savedCalendarEntityEntry.getUserEmail(),
                savedCalendarEntityEntry.getEntryType(),
                savedCalendarEntityEntry.getCalendarEntry()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
    }

    @DeleteMapping("/deleteCalendarEntry/{id}")
    ResponseEntity<?> removeEntry(HttpServletRequest request, @PathVariable String id){
        final CalendarEntity deletedCalendarEntry = calendarService.deleteCalendarEntry(request ,id);
        return ResponseEntity.status(HttpStatus.OK).body(deletedCalendarEntry);
    }
}
