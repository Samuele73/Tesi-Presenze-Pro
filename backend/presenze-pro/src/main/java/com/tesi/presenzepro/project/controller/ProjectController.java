package com.tesi.presenzepro.project.controller;

import com.tesi.presenzepro.project.dto.CreateProjectRequest;
import com.tesi.presenzepro.project.dto.ProjectIdResponse;
import com.tesi.presenzepro.project.model.Project;
import com.tesi.presenzepro.project.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/projects")
@CrossOrigin(origins = "http://localhost:4200")
@Tag(name = "Project", description = "Operazioni relative ai progetti")
public class ProjectController {
    private final ProjectService service;

    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
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
    @Operation(description = "Obtain all projects belonging to the authenticated user (email taken from tkn)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<Project>> getMyProjects() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<Project> projects = service.findProjectsByUserEmail(email);
        return ResponseEntity.ok(projects);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @GetMapping("/user/{email}")
    @Operation(description = "Obtain all projects assigned to the specified user by email", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<Project>> getProjectsByUserEmail(@PathVariable String email) {
        List<Project> projects = service.findProjectsByUserEmail(email);
        return projects.isEmpty()
                ? ResponseEntity.noContent().build()
                : ResponseEntity.ok(projects);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @PostMapping("")
    @Operation(description = "Save a new project", security = @SecurityRequirement(name = "bearerAuth"))
    ResponseEntity<Project> saveProject(@RequestBody CreateProjectRequest project, HttpServletRequest request) {
        System.out.println("New project " + project);
        Project savedProject = service.saveProject(project, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedProject);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @PutMapping("/{id}")
    @Operation(description = "Modify a project referred by its ID", security = @SecurityRequirement(name = "bearerAuth"))
    ResponseEntity<Project> updateProject(@RequestBody Project project, @PathVariable String id) {
        Project updatedProject = service.updateProject(project, id);
        return ResponseEntity.status(HttpStatus.OK).body(updatedProject);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    @DeleteMapping("/{id}")
    @Operation(description = "Delete the referred project", security = @SecurityRequirement(name = "bearerAuth"))
    ResponseEntity<ProjectIdResponse> deleteProject(@PathVariable String id) {
        String delProjectID = service.deleteProject(id);
        return ResponseEntity.status(HttpStatus.OK).body(new ProjectIdResponse(delProjectID));
    }

}
