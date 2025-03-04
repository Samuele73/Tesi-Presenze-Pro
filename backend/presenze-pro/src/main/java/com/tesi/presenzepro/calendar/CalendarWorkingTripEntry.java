package com.tesi.presenzepro.calendar;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Schema(description = "Rappresenta una entry di una trasferta nel calendario")
public class CalendarWorkingTripEntry implements CalendarEntry{
    private Date from;
    private Date to;

}
