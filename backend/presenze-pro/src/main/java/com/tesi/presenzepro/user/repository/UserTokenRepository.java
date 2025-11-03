package com.tesi.presenzepro.user.repository;

import com.tesi.presenzepro.user.model.TokenType;
import com.tesi.presenzepro.user.model.UserToken;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserTokenRepository extends MongoRepository<UserToken, String> {
    Optional<UserToken> findByUserEmail(String userEmail);

    Optional<UserToken> deleteAllByUserEmailAndTokenType(String userEmail, TokenType token);

    UserToken findByToken(String token);
}

