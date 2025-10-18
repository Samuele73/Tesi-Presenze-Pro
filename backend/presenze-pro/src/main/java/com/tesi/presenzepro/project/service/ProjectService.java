package com.tesi.presenzepro.project.service;

import com.tesi.presenzepro.project.dto.CreateProjectRequest;
import com.tesi.presenzepro.project.exception.NoProjectFound;
import com.tesi.presenzepro.project.exception.NoUserForProjectFound;
import com.tesi.presenzepro.project.mapper.ProjectMapper;
import com.tesi.presenzepro.project.model.Project;
import com.tesi.presenzepro.project.repository.ProjectRepository;
import com.tesi.presenzepro.user.service.UserService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@AllArgsConstructor
@Service
public class ProjectService {
    private ProjectRepository projectRepository;
    private UserService userService;
    private ProjectMapper projectMapper;

    public List<Project> findAllProjects(){
        return this.projectRepository.findAll();
    }

    public Project saveProject(CreateProjectRequest project){
        if (project.assignedTo() != null && !project.assignedTo().isEmpty()) {
            project.assignedTo().forEach(email -> {
                this.userService.findByEmail(email)
                        .orElseThrow(() -> new NoUserForProjectFound(email));
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
        }
    }

    public Project updateProject(Project project, String id){
        //TODO: aggiungi un nuovo controllo fondamentale -> se cambio gli assignedTo
        if(!project.getId().equals(id))
            throw new IllegalArgumentException("Project id does not match");
        Project oldProject = this.projectRepository.findById(id).orElseThrow(() -> new NoProjectFound(""));
        project.setId(id);
        final Project updatedProject = this.projectRepository.save(project);
        this.updateUsersOnProjectUpdate(oldProject, updatedProject);
        return updatedProject;
    }


}
