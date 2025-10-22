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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
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

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("")
    @Operation(description = "Obtain all projects", security = @SecurityRequirement(name = "bearerAuth"))
    ResponseEntity<List<Project>> getAllProjects() {
        List<Project> projects = service.findAllProjects();
        return ResponseEntity.status(HttpStatus.OK).body(projects);
    }

    @GetMapping("/{id}")
    @Operation(description = "Obtain project by Id", security = @SecurityRequirement(name = "bearerAuth"))
    ResponseEntity<Project> getProjectById(@PathVariable String id) {
        Project project = service.findProjectById(id);
        return ResponseEntity.status(HttpStatus.OK).body(project);
    }


    @GetMapping("/user")
    @Operation(description = "Obtain all projects belonging to the authenticated user", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<Project>> getMyProjects() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<Project> projects = service.findProjectsByUserEmail(email);
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/user/{email}")
    @Operation(description = "Obtain all projects assigned to the specified user by email", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<Project>> getProjectsByUserEmail(@PathVariable String email) {
        List<Project> projects = service.findProjectsByUserEmail(email);
        return projects.isEmpty()
                ? ResponseEntity.noContent().build()
                : ResponseEntity.ok(projects);
    }

    @PostMapping("")
    @Operation(description = "Save a new project", security = @SecurityRequirement(name = "bearerAuth"))
    ResponseEntity<Project> saveProject(@RequestBody CreateProjectRequest project) {
        Project savedProjet = service.saveProject(project);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedProjet);
    }

    @PutMapping("/{id}")
    @Operation(description = "Save a new project", security = @SecurityRequirement(name = "bearerAuth"))
    ResponseEntity<Project> updateProject(@RequestBody Project project, @PathVariable String id) {
        Project updatedProject = service.updateProject(project, id);
        return ResponseEntity.status(HttpStatus.OK).body(updatedProject);
    }

    @DeleteMapping("/{id}")
    @Operation(description = "Delete the referred project", security = @SecurityRequirement(name = "bearerAuth"))
    ResponseEntity<String> deleteProject(@PathVariable String id) {
        String delProjectID = service.deleteProject(id);
        return ResponseEntity.status(HttpStatus.OK).body(delProjectID);
    }

}
