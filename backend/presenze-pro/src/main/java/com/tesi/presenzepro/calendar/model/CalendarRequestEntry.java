package com.tesi.presenzepro.calendar.model;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Schema(description = "Rappresenta una entry di una richiesta nel calendario")
public class CalendarRequestEntry implements CalendarEntry {
    private String requestType;
    private Date dateFrom;
    private Date dateTo;
    private String timeFrom;
    private String timeTo;
}
