package com.tesi.presenzepro.calendar.controller;

import com.tesi.presenzepro.calendar.dto.ApprovalRequestTab;
import com.tesi.presenzepro.calendar.dto.CalendarResponseDto;
import com.tesi.presenzepro.calendar.dto.SaveCalendarEntityRequestDto;
import com.tesi.presenzepro.calendar.dto.UserRequestResponseDto;
import com.tesi.presenzepro.calendar.model.CalendarEntity;
import com.tesi.presenzepro.calendar.model.PagedResponse;
import com.tesi.presenzepro.calendar.model.RequestType;
import com.tesi.presenzepro.calendar.service.CalendarService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @Operation(description = "Ottieni tutte le richieste in base al ruolo utente: admin, owner", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/requests")
    ResponseEntity<PagedResponse<UserRequestResponseDto>> getAllRequests(HttpServletRequest request, @PageableDefault(size = 10) Pageable pageable, @RequestParam(required = false) List<RequestType> types,
                                                                         @RequestParam(required = false) List<String> users, @RequestParam ApprovalRequestTab tab){
        System.out.println("Types: " + types);
        System.out.println("users: " + users);
        final PagedResponse<UserRequestResponseDto> requests = calendarService.getAllUserRequests(request, pageable, types, users, tab);
        System.out.println("requests: " + requests);
        return ResponseEntity.status(HttpStatus.OK).body(requests);
    }

    @Operation(description = "Ottieni tutte le richieste in base al ruolo utente: admin, owner", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/my-requests")
    ResponseEntity<PagedResponse<UserRequestResponseDto>> getUserRequests(HttpServletRequest request, @PageableDefault(size = 10) Pageable pageable, @RequestParam(required = false) List<RequestType> types, @RequestParam ApprovalRequestTab tab){
        final PagedResponse<UserRequestResponseDto> requests = calendarService.getMyRquests(request, pageable, types, tab);
        return ResponseEntity.status(HttpStatus.OK).body(requests);
    }

    @Operation(description = "Save a new calendar entry", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("")
    ResponseEntity<CalendarResponseDto> saveCalendarEntity(HttpServletRequest request, @RequestBody SaveCalendarEntityRequestDto calendarEntityEntry){
        final CalendarResponseDto savedCalendarEntityEntry = calendarService.saveNewCalendarEntry(request, calendarEntityEntry);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedCalendarEntityEntry);
    }

    @Operation(description = "Save calendar entries in bulk", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/bulk")
    ResponseEntity<List<CalendarResponseDto>> saveMultipleCalendarEntities(HttpServletRequest request, @RequestBody List<SaveCalendarEntityRequestDto> calendarEntities){
        final List<CalendarResponseDto> savedCalendarEntities = calendarService.saveCalendarEntities(request, calendarEntities);
        System.out.println("saved calendar entities: " + savedCalendarEntities);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedCalendarEntities);
    }

    @Operation( security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/{id}")
    ResponseEntity<CalendarResponseDto> deleteCalendarEntity(HttpServletRequest request, @PathVariable String id){
        final CalendarResponseDto deletedCalendarEntry = calendarService.deleteCalendarEntry(request ,id);
        return ResponseEntity.status(HttpStatus.OK).body(deletedCalendarEntry);
    }

    @Operation( security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/batchDelete") //maybe change it to DELETE
    ResponseEntity<List<CalendarResponseDto>> deleteMultipleCalendarEntities(HttpServletRequest request, @RequestBody List<String> ids){
        final List<CalendarResponseDto> deletedCalendarEntities = calendarService.deleteCalendarEntries(request, ids);
        return ResponseEntity.status(HttpStatus.OK).body(deletedCalendarEntities);
    }

    @Operation(security = @SecurityRequirement(name = "bearerAuth"))
    @PutMapping("/{id}")
    ResponseEntity<CalendarResponseDto> updateCalendarEntity(HttpServletRequest request , @RequestBody CalendarEntity newCalendarEntity, @PathVariable String id){
        final CalendarResponseDto updatedCalendarEntity = calendarService.updateCalendarEntity(request, id, newCalendarEntity);
        return ResponseEntity.status(HttpStatus.OK).body(updatedCalendarEntity);
    }

    @Operation(security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/batchUpdate") //maybe change it to PUT
    ResponseEntity<List<CalendarResponseDto>> updateCalendarEntities(HttpServletRequest request, @RequestBody List<CalendarEntity> calendarEntities){
        System.out.println("sfdsdfsdffds: " + calendarEntities.toString());
        final List<CalendarResponseDto> updatedCalendarEntities = calendarService.updateCalendarEntities(request, calendarEntities);
        return ResponseEntity.status(HttpStatus.OK).body(updatedCalendarEntities);
    }
}
