package com.tesi.presenzepro.project.service;

import com.tesi.presenzepro.project.model.Project;
import com.tesi.presenzepro.project.repository.ProjectRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@AllArgsConstructor
@Service
public class ProjectService {
    private ProjectRepository projectRepository;

    public List<Project> findAllProjects(){
        return this.projectRepository.findAll();
    }
}
