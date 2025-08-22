package com.tesi.presenzepro.calendar.dto;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.tesi.presenzepro.calendar.BaseCalendarEntityDeserializer;
import com.tesi.presenzepro.calendar.model.BaseCalendarEntity;
import com.tesi.presenzepro.calendar.model.CalendarEntry;
import com.tesi.presenzepro.calendar.model.CalendarEntryType;
import lombok.*;

@EqualsAndHashCode(callSuper = true)
@AllArgsConstructor
@Builder
@Data
@JsonDeserialize(using = BaseCalendarEntityDeserializer.class)
public class SaveCalendarEntityRequestDto extends BaseCalendarEntity{
}
