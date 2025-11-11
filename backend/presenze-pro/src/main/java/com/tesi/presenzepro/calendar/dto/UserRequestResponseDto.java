package com.tesi.presenzepro.calendar.dto;

import com.tesi.presenzepro.calendar.model.RequestStatus;
import com.tesi.presenzepro.calendar.model.RequestType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@Builder
public class UserRequestResponseDto {
    private String id;
    private String userEmail;
    private RequestType type;
    private LocalDateTime dateFrom;
    private LocalDateTime dateTo;
    private RequestStatus status;
}
