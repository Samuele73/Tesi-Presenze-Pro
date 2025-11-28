package com.tesi.presenzepro.project.service;

import com.tesi.presenzepro.calendar.service.CalendarService;
import com.tesi.presenzepro.project.dto.CreateProjectRequest;
import com.tesi.presenzepro.project.exception.NoProjectFound;
import com.tesi.presenzepro.project.exception.NoUserForProjectFound;
import com.tesi.presenzepro.project.mapper.ProjectMapper;
import com.tesi.presenzepro.project.model.Project;
import com.tesi.presenzepro.project.repository.ProjectRepository;
import com.tesi.presenzepro.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@AllArgsConstructor
@Service
public class ProjectService {
    private ProjectRepository projectRepository;
    private UserService userService;
    private ProjectMapper projectMapper;
    private CalendarService calendarService;

    public List<Project> findAllProjects(){
        return this.projectRepository.findAll();
    }

    public List<Project> findProjectsByUserEmail(String email){
        return this.projectRepository.findByAssignedToContaining(email).orElse(new ArrayList<>());
    }

    public Project findProjectById(String id){
        return this.projectRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
    }

    public Project saveProject(CreateProjectRequest project, HttpServletRequest request) {
        final String userEmail = request.getUserPrincipal().getName();
        System.out.println("User email: " + userEmail);
        final String userRole = this.userService.getCurrentUserRole();
        System.out.println("User role: " + userRole);
        if (project.assignedTo() != null && !project.assignedTo().isEmpty()) {
            project.assignedTo().forEach(email -> {
                if (userRole.equals("ADMIN") && email.equals(userEmail))
                    throw new AccessDeniedException("Un admin non può auto-assegnarsi un progetto!");
                this.userService.findByEmail(email)
                        .orElseThrow(() -> new NoUserForProjectFound("Una o più email indicate non risultano registrate!"));
                this.userService.addUserProjectByEmail(email, project.name());
            });
        }
        final Project finalProject = this.projectMapper.fromCreateRequestToProject(project);
        return this.projectRepository.save(finalProject);
    }

    //Controlla se vi è bisogno di aggiornare il campo AssignedProjects nel doc User
    private void updateUsersOnProjectUpdate(Project oldProject, Project newProject) {
        List<String> oldAssignedTo = getAssignedToOrEmpty(oldProject);
        List<String> newAssignedTo = getAssignedToOrEmpty(newProject);

        Set<String> removedUsers = findRemovedUsers(oldAssignedTo, newAssignedTo);
        Set<String> addedUsers = findAddedUsers(oldAssignedTo, newAssignedTo);

        String oldProjectName = oldProject.getName();
        String newProjectName = newProject.getName();

        removeProjectFromUsers(removedUsers, oldProjectName);
        addProjectToUsers(addedUsers, newProjectName);
        updateProjectNameIfChanged(oldProjectName, newProjectName);
    }

    private List<String> getAssignedToOrEmpty(Project project) {
        return Optional.ofNullable(project.getAssignedTo()).orElse(List.of());
    }

    private Set<String> findRemovedUsers(List<String> oldAssignedTo, List<String> newAssignedTo) {
        Set<String> oldSet = new HashSet<>(oldAssignedTo);
        Set<String> newSet = new HashSet<>(newAssignedTo);

        Set<String> removed = new HashSet<>(oldSet);
        removed.removeAll(newSet);

        return removed;
    }

    private Set<String> findAddedUsers(List<String> oldAssignedTo, List<String> newAssignedTo) {
        Set<String> oldSet = new HashSet<>(oldAssignedTo);
        Set<String> newSet = new HashSet<>(newAssignedTo);

        Set<String> added = new HashSet<>(newSet);
        added.removeAll(oldSet);

        return added;
    }

    private void removeProjectFromUsers(Set<String> users, String projectName) {
        if (!users.isEmpty()) {
            userService.removeProjectFromUsers(new ArrayList<>(users), projectName);
        }
    }

    private void addProjectToUsers(Set<String> users, String projectName) {
        if (!users.isEmpty()) {
            users.forEach(email -> userService.addUserProjectByEmail(email, projectName));
        }
    }

    private void updateProjectNameIfChanged(String oldProjectName, String newProjectName) {
        if (!oldProjectName.equals(newProjectName)) {
            userService.updateProjectNameForAll(oldProjectName, newProjectName);
            calendarService.updateCalendarEntitiesProjectName(oldProjectName, newProjectName);
        }
    }

    public Project updateProject(Project project, String id){
        if(!project.getId().equals(id))
            throw new IllegalArgumentException("Project id does not match");
        Project oldProject = this.projectRepository.findById(id).orElseThrow(() -> new NoProjectFound(id));
        project.setId(id);
        project.getAssignedTo().forEach(email -> this.userService.findByEmail(email).orElseThrow(() -> new NoUserForProjectFound(email + " non è registrata")));
        final Project updatedProject = this.projectRepository.save(project);
        this.updateUsersOnProjectUpdate(oldProject, updatedProject);
        return updatedProject;
    }

    public String deleteProject(String id){
        Project removedProject = this.projectRepository.removeById(id).orElseThrow(() -> new NoProjectFound(id));
        List<String> assignedUsers = removedProject.getAssignedTo();
        //Remove the project from all users assigned to
        assignedUsers.forEach(email -> {this.userService.removeProjectFromUsers(new ArrayList<>(assignedUsers), removedProject.getName());});
        return id;
    }


}
