package com.tesi.presenzepro.user.repository;

import com.tesi.presenzepro.user.model.Role;
import com.tesi.presenzepro.user.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String>, UserRepositoryCustom {

    User findByEmailAndPwd(String email, String pwd);

    Optional<User> findByEmail(String email);

    Optional<User> deleteByEmail(String email);

    List<User> findByRoleIn(Collection<Role> roles);
}
