package com.tesi.presenzepro.user.repository;

import com.tesi.presenzepro.user.model.User;
import lombok.AllArgsConstructor;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.Optional;

@AllArgsConstructor
public class UserRepositoryCustomImpl implements UserRepositoryCustom {

    private final MongoTemplate mongoTemplate;

    @Override
    public Optional<User> findByIdAndModify(User user) {
        Query query = new Query().addCriteria(Criteria.where("email").is(user.getEmail()));
        Update update = new Update();

        // Aggiornamento campi di User
        if(user.getRole() != null)
            update.set("role", user.getRole());
        if(user.getPwd() != null)
            update.set("pwd", user.getPwd());

        // Aggiornamento UserProfile (dati anagrafici + lavorativi)
        if(user.getProfile() != null) {
            if(user.getProfile().name() != null)
                update.set("profile.name", user.getProfile().name());
            if(user.getProfile().surname() != null)
                update.set("profile.surname", user.getProfile().surname());
            if(user.getProfile().serialNum() != null)
                update.set("profile.serialNum", user.getProfile().serialNum());
            if(user.getProfile().duty() != null)
                update.set("profile.duty", user.getProfile().duty());
            if(user.getProfile().employmentType() != null)
                update.set("profile.employmentType", user.getProfile().employmentType());
            if(user.getProfile().hireDate() != null)
                update.set("profile.hireDate", user.getProfile().hireDate());
            if(user.getProfile().birthDate() != null)
                update.set("profile.birthDate", user.getProfile().birthDate());
            if(user.getProfile().address() != null)
                update.set("profile.address", user.getProfile().address());
            if(user.getProfile().phone() != null)
                update.set("profile.phone", user.getProfile().phone());
            if(user.getProfile().iban() != null)
                update.set("profile.iban", user.getProfile().iban());
        }

        // Aggiornamento UserData (solo progetti assegnati)
        if(user.getData() != null) {
            if(user.getData().assignedProjects() != null)
                update.set("data.assignedProjects", user.getData().assignedProjects());
        }

        FindAndModifyOptions options = new FindAndModifyOptions().returnNew(true).upsert(false);
        User newUpdatedUser = mongoTemplate.findAndModify(query, update, options, User.class);

        System.out.println(newUpdatedUser + " query: " + query + " update: " + update);

        return Optional.ofNullable(newUpdatedUser);
    }

    public Optional<User> addProjectByEmail(String email, String projectName) {
        Query query = new Query().addCriteria(Criteria.where("email").is(email));
        Update update = new Update().addToSet("data.assignedProjects", projectName);

        FindAndModifyOptions options = new FindAndModifyOptions().returnNew(true).upsert(false);
        User updatedUser = mongoTemplate.findAndModify(query, update, options, User.class);

        return Optional.ofNullable(updatedUser);
    }
}