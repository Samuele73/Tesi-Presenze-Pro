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

import java.util.List;

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

    //Controlla se vi è bisogno di aggiornare il campoAssignedProjects nel doc User
    private void updateUsersOnProjectUpdate(Project oldProject, Project newProject){
        List<String> oldAssignedTo = oldProject.getAssignedTo();
        List<String> newAssignedTo = newProject.getAssignedTo();

        // Utenti rimossi = quelli presenti in old ma non in new
        List<String> removedUsers = oldAssignedTo.stream()
                .filter(email -> !newAssignedTo.contains(email))
                .toList();

        // Utenti aggiunti = quelli presenti in new ma non in oldc
        final String oldProjectName =  oldProject.getName();
        List<String> addedUsers = newAssignedTo.stream()
                .filter(email -> !oldAssignedTo.contains(email))
                .toList();
        //Rimuovi progetto agli utenti alla quale non è più assegnato
        if (!removedUsers.isEmpty()) {
            userService.removeProjectFromUsers(removedUsers, oldProjectName);
        }

        // Aggiungi progetto ai nuovi utenti assegnati
        if (!addedUsers.isEmpty()) {
            addedUsers.forEach(email ->
                    userService.addUserProjectByEmail(email, oldProject.getName())
            );
        }

        if (!oldProjectName.equals(newProject.getName())) {
            userService.updateProjectNameForAll(oldProjectName, newProject.getName());
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
