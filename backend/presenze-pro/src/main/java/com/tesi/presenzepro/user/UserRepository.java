package com.tesi.presenzepro.user;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String>, UserRepositoryCustom {

    User findByEmailAndPwd(String email, String pwd);

    Optional<User> findByEmail(String email);
}
