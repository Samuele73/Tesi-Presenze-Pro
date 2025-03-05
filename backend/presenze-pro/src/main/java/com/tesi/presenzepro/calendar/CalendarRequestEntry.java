package com.tesi.presenzepro.calendar;

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
public class CalendarRequestEntry implements CalendarEntry{
    private String request_type;
    private Date date_from;
    private Date date_to;
    private String time_from;
    private String time_to;
}
