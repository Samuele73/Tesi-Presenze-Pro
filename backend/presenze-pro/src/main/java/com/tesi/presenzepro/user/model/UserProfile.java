package com.tesi.presenzepro.user.model;

import java.util.Date;

public record UserProfile(
        String name,
        String surname,
        String email,
        Long serialNum,
        String duty,
        String employmentType,
        Date hireDate,
        Date birthDate,
        String address,
        String phone,
        Long iban,
        Role role
) {
}
