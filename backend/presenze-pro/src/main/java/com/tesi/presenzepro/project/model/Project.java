package com.tesi.presenzepro.project.model;

import com.fasterxml.jackson.databind.annotation.EnumNaming;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document
@Data
@AllArgsConstructor
@Builder
public class Project {
    @Id
    private String id;
    private String name;
    private String summary;
    private String description;
    private ProjectStatus status;
    //Lista di utenti alla quale è assegnato il progetto (utente identificato per email)
    private List<String> assignedTo;
}
