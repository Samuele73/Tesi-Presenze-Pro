package com.tesi.presenzepro.calendar.controller;

import com.tesi.presenzepro.calendar.dto.CalendarResponseDto;
import com.tesi.presenzepro.calendar.dto.SaveCalendarEntityRequestDto;
import com.tesi.presenzepro.calendar.model.CalendarEntity;
import com.tesi.presenzepro.calendar.service.CalendarService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
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
@Tag(name = "Calendar", description = "Operazioni relative al calendario")
public class CalendarController {
    private final CalendarService calendarService;

    @Operation(description = "Obtain all entries from the provided user", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("")
    ResponseEntity<List<CalendarResponseDto>> getAllCalendarEntities(HttpServletRequest request){
        final List<CalendarResponseDto> calendarEntries = calendarService.getAllUserEntries(request);
        return ResponseEntity.status(HttpStatus.OK).body(calendarEntries);
    }

    @Operation(description = "Obtain all user calendar entries from specific month and year", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/byMonthYear")
    ResponseEntity<List<CalendarResponseDto>> getCalendarEntitiesByMonthYear(HttpServletRequest request , @RequestParam String month, @RequestParam String year){
        final List<CalendarResponseDto> calendarEntries = calendarService.getUserEntriesByMonthYear(request ,Integer.parseInt(month), Integer.parseInt(year));
        return ResponseEntity.status(HttpStatus.OK).body(calendarEntries);
    }

    @Operation(description = "Save a new calendar entry", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("")
    ResponseEntity<CalendarResponseDto> saveCalendarEntity(@RequestBody SaveCalendarEntityRequestDto calendarEntityEntry){
        final CalendarResponseDto savedCalendarEntityEntry = calendarService.saveNewCalendarEntry(calendarEntityEntry);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedCalendarEntityEntry);
    }

    @Operation(security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/{id}")
    ResponseEntity<CalendarResponseDto> deleteCalendarEntity(HttpServletRequest request, @PathVariable String id){
        final CalendarResponseDto deletedCalendarEntry = calendarService.deleteCalendarEntry(request ,id);
        return ResponseEntity.status(HttpStatus.OK).body(deletedCalendarEntry);
    }

    @Operation(security = @SecurityRequirement(name = "bearerAuth"))
    @PutMapping("/{id}")
    ResponseEntity<CalendarResponseDto> updateCalendarEntity(HttpServletRequest request , @RequestBody CalendarEntity newCalendarEntity, @PathVariable String id){
        final CalendarResponseDto updatedCalendarEntity = calendarService.updateCalendarEntity(request, id, newCalendarEntity);
        return ResponseEntity.status(HttpStatus.OK).body(updatedCalendarEntity);
    }
}
