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
        if(user.getName() != null)
            update.set("name", user.getName());
        if(user.getSurname() != null)
            update.set("surname", user.getSurname());
        if(user.getSerialNum() != null)
            update.set("serialNum", user.getSerialNum());
        if(user.getDuty() != null)
            update.set("duty", user.getDuty());
        if(user.getEmploymentType() != null)
            update.set("employmentType", user.getEmploymentType());
        if(user.getHireDate() != null)
            update.set("hireDate", user.getHireDate());
        if(user.getIban() != null)
            update.set("Iban", user.getIban());
        if(user.getBirthDate() != null)
            update.set("birthDate", user.getBirthDate());
        if(user.getAddress() != null)
            update.set("address", user.getAddress());
        if(user.getPhone() != null)
            update.set("phone", user.getPhone());
        if(user.getRole() != null)
             update.set("role", user.getRole());
        if(user.getRole() != null)
            update.set("pwd", user.getPwd());
        FindAndModifyOptions options = new FindAndModifyOptions().returnNew(true).upsert(false);
        User newUpdatedUser = mongoTemplate.findAndModify(query, update, options, User.class);
        System.out.println(newUpdatedUser + "query" + update);
        if(newUpdatedUser == null)
            return Optional.empty();
        return Optional.of(newUpdatedUser);
    }
}
