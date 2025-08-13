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
public class PasswordResetToken {

    private static final int EXPIRATION_HOURS = 24;
    @Id
    private String id;
    private String token;
    private String userEmail;
    private Date expiryDate;

    public PasswordResetToken(String token, String userEmail){
        this.token = token;
        this.userEmail = userEmail;
        Calendar calendar = Calendar.getInstance();
        calendar.add(Calendar.HOUR_OF_DAY, EXPIRATION_HOURS);
        this.expiryDate = calendar.getTime();
    }

}
