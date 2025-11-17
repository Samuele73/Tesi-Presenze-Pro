package com.tesi.presenzepro.calendar.model;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.tesi.presenzepro.calendar.BaseCalendarEntityDeserializer;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Document
@JsonDeserialize(using = BaseCalendarEntityDeserializer.class)
@Schema(description = "Rappresenta una entry del calendario nella sua interezza, cioè quella che viene visualizzata nel DB")
public class CalendarEntity extends BaseCalendarEntity{

    @Id
    private String id;
    @Indexed
    private String userEmail; //User Email associated with the calendar Entry
    @CreatedDate
    private Date createdAt;
}
