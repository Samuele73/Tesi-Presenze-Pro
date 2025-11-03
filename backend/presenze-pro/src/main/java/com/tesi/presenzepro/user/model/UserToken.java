package com.tesi.presenzepro.user.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Calendar;
import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document
public class UserToken {

    @Id
    private String id;
    private String token;
    private String userEmail;
    private Date expiryDate;
    private TokenType tokenType;

    public UserToken(String token, String userEmail, TokenType tokenType) {
        this.token = token;
        this.userEmail = userEmail;
        this.tokenType = tokenType;

        Calendar calendar = Calendar.getInstance();
        calendar.add(Calendar.HOUR_OF_DAY, tokenType.getExpirationHours());
        this.expiryDate = calendar.getTime();
    }

    public boolean isExpired() {
        return new Date().after(this.expiryDate);
    }

    public boolean isValid() {
        return !isExpired();
    }


}
