package com.tesi.presenzepro.project.controller;

import com.tesi.presenzepro.project.dto.CreateProjectRequest;
import com.tesi.presenzepro.project.model.Project;
import com.tesi.presenzepro.project.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/project")
@CrossOrigin(origins = "http://localhost:4200")
@Tag(name = "Project", description = "Operazioni relative ai progetti")
public class ProjectController {
    private final ProjectService service;

    @GetMapping("")
    @Operation(description = "Obtain all projects", security = @SecurityRequirement(name = "bearerAuth"))
    ResponseEntity<List<Project>> getAllProjects() {
        List<Project> projects = service.findAllProjects();
        return ResponseEntity.status(HttpStatus.OK).body(projects);
    }

    @PostMapping("")
    @Operation(description = "Save a new project", security = @SecurityRequirement(name = "bearerAuth"))
    ResponseEntity<Project> saveProject(@RequestBody CreateProjectRequest project) {
        Project savedProjet = service.saveProject(project);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedProjet);
    }

}
