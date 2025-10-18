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

    public Project updateProject(Project project, String id){
        //TODO: aggiungi un nuovo controllo fondamentale -> se cambio gli assignedTo
        if(!project.getId().equals(id))
            throw new IllegalArgumentException("Project id does not match");
        String oldProjectName = this.projectRepository.findById(id).orElseThrow(() -> new NoProjectFound("")).getName();
        project.setId(id);
        final Project updatedProject = this.projectRepository.save(project);
        final String updatedProjectName = updatedProject.getName();
        if(!oldProjectName.equals(updatedProjectName))
            this.userService.updateProjectNameForAll(oldProjectName, updatedProjectName);
        return updatedProject;
    }


}
