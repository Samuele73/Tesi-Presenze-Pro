package com.tesi.presenzepro.jwt;

import com.tesi.presenzepro.user.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.security.Key;
import java.util.Date;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class JwtUtils {

    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);
    @Value("${spring.app.jwtSecret}")
    private String SECRET_KEY;
    @Value("${spring.app.jwtExpirationMs}")
    private int EXPIRATION_TIME;

    private Key key(){
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(SECRET_KEY));
    }

    public String getJwtFromHeader(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        logger.debug("Authorization header: {}", bearerToken);
        if(bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); //remove bearer prefix
        }
        return null;
    }

    public String generateTokenFromUsername(UserDetails userDetails) {
        String username = userDetails.getUsername();
        return Jwts.builder()
                .subject(username)
                .issuedAt(new Date())
                .expiration(new Date(new Date().getTime() + EXPIRATION_TIME))
                .signWith(key())
                .compact();
    }

    public String getUsernameFromJwt(String token) {
        return Jwts.parser()
                .verifyWith((SecretKey) key())
                .build()
                .parseSignedClaims(token)
                .getPayload().getSubject();
    }

    public boolean validateJwtToken(String authToken) {
        try{
            Jwts.parser()
                    .verifyWith((SecretKey) key())
                    .build()
                    .parseSignedClaims(authToken);
            return true;
        }catch(MalformedJwtException e){
            logger.error("Invalid JWT token: {}", e.getMessage());
        }catch(ExpiredJwtException e){
            logger.error("Expired JWT token: {}", e.getMessage());
        }catch(UnsupportedJwtException e){
            logger.error("Unsupported JWT token: {}", e.getMessage());
        }catch(IllegalArgumentException e){
            logger.error("JWT claims string is empty: {}", e.getMessage());
        }
        return false;
    }
}
