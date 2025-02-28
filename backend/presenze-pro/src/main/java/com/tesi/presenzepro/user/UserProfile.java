package com.tesi.presenzepro.user;

import java.util.Date;

public record UserProfile(
        String name,
        String surname,
        String email,
        Integer serialNum,
        String duty,
        String employmentType,
        Date hireDate,
        Date birthDate,
        String address,
        String phone,
        Integer iban,
        Role role
) {
}
