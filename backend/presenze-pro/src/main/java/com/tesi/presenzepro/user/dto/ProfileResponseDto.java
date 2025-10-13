package com.tesi.presenzepro.user.dto;

import com.tesi.presenzepro.user.model.Role;

import java.util.Date;

public record ProfileResponseDto(
        String name,
        String surname,
        Long serialNum,
        String duty,
        String employmentType,
        Date hireDate,
        Date birthDate,
        String address,
        String phone,
        Long iban,
        String email,
        Role role
) {
}
