package com.tesi.presenzepro.user.model;

public enum TokenType {
    REGISTRATION(48),      // 48 ore
    PASSWORD_RESET(24);    // 24 ore

    private final int expirationHours;

    TokenType(int expirationHours) {
        this.expirationHours = expirationHours;
    }

    public int getExpirationHours() {
        return expirationHours;
    }
}