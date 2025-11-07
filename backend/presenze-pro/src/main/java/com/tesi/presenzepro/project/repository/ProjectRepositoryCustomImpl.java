package com.tesi.presenzepro.project.repository;

import com.mongodb.client.result.UpdateResult;
import com.tesi.presenzepro.project.model.Project;
import lombok.AllArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

@AllArgsConstructor
public class ProjectRepositoryCustomImpl implements ProjectRepositoryCustom {
    private final MongoTemplate mongoTemplate;

    @Override
    public boolean removeUserFromAllProjects(String email) {
        Query query = new Query(Criteria.where("assignedTo").is(email));
        Update update = new Update().pull("assignedTo", email);

        UpdateResult result = mongoTemplate.updateMulti(query, update, Project.class);

        return result.getModifiedCount() > 0;
    }
}
