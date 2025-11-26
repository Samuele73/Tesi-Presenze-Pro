package com.tesi.presenzepro.user.service;

import com.tesi.presenzepro.user.exception.UserTokenNotValidException;
import com.tesi.presenzepro.user.model.TokenType;
import com.tesi.presenzepro.user.model.UserToken;
import com.tesi.presenzepro.user.repository.UserTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Calendar;

@Service
@RequiredArgsConstructor
public class UserTokenService {
    private final UserTokenRepository userTokenRepository;

    public void saveUserToken(String userEmail, String token, TokenType tokenType){
        UserToken myToken = new UserToken(token, userEmail, tokenType);
        this.userTokenRepository.deleteAllByUserEmailAndTokenType(userEmail, tokenType);
        this.userTokenRepository.save(myToken); //modificare per far si che venga controllato se esiste già un token e resettarlo
    }

    public String getEmailFromUserTknValidation(String token){
        final UserToken userToken = this.userTokenRepository.findByToken(token);
        if(!this.isUserTokenFound(userToken) || userToken.getUserEmail() == null)
            throw new UserTokenNotValidException("Il token non è valido");
        if(this.isUserTokenExpired(userToken))
            throw new UserTokenNotValidException("Il token è scaduto");
        return userToken.getUserEmail();
    }

    public boolean isUserTokenValid(String token){
        final UserToken resetToken = userTokenRepository.findByToken(token);
        System.out.println("CONTROLLA user tkn: " + resetToken + " " + (!isUserTokenFound(resetToken) || !resetToken.isExpired()) );
        return isUserTokenFound(resetToken) && !resetToken.isExpired();
    }

    private boolean isUserTokenFound(UserToken resetToken){
        return resetToken != null;
    }

    private boolean isUserTokenExpired(UserToken resetToken){
        final Calendar cal = Calendar.getInstance();
        return resetToken.getExpiryDate().before(cal.getTime());
    }
}
