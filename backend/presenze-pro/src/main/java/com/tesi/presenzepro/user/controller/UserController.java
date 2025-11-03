package com.tesi.presenzepro.user.controller;

import com.tesi.presenzepro.user.dto.*;
import com.tesi.presenzepro.user.model.User;
import com.tesi.presenzepro.user.model.UserData;
import com.tesi.presenzepro.user.model.UserProfile;
import com.tesi.presenzepro.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.Response;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/users")
@CrossOrigin(origins = "http://localhost:4200")
@Tag(name = "User", description = "Operazioni relative all'utente")
public class UserController {

    private final UserService service;

    @PostMapping("/login")
    public ResponseEntity<UserAuthResponseDto> login(@RequestBody LoginRequestDto user){
        return ResponseEntity.ok(service.login(user));
    }

    @PostMapping("/signin")
    public ResponseEntity<User> signIn(@RequestBody SignInRequestDto user){
        User savedUser = service.signIn(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
    }

    //Aggiungere cattura exception di JWTService
    @Operation(description = "Valida il token inviato")
    @PostMapping("/secure")
    public ResponseEntity<Boolean> validToken(@RequestBody String token){
        final boolean isTokenValid = service.isTokenValid(token);
        return ResponseEntity.status(HttpStatus.OK).body(isTokenValid);
    }

    //Utilizzato per reperire i dati del profilo dell
    @Operation(description = "Ottieni il profilo utente",security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/profile")
    public ResponseEntity<ProfileResponseDto> getUserProfile(HttpServletRequest request){
         final ProfileResponseDto user = service.getUserProfile(request);
        System.out.println("profile user: " + user);
         return ResponseEntity.ok(user);
    }

    @Operation(description = "Ottieni il campo dati dell'utente in base al tkn nell'headder", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/data")
    public ResponseEntity<UserData> getUserData(HttpServletRequest request){
        final UserData userData = service.getUserData(request);
        return ResponseEntity.ok(userData);
    }
    
    //Implementare il metodo di aggiornamento
    @Operation(description = "Modifica le credenziali del profilo utente", security = @SecurityRequirement(name = "bearerAuth"))
    @PutMapping("/profile")
    public ResponseEntity<ProfileResponseDto> updateUserProfile(@RequestBody User updatedUserProfile){
        final ProfileResponseDto newProfile = service.updateUserProfile(updatedUserProfile);
        return ResponseEntity.status(HttpStatus.OK).body(newProfile);
    }

    //Rotta raggiunta tramite la pagina di password dimenticata. genera l'email
    @Operation(description = "Richiede il reset della password. Consegue l'invio di una email", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/resetPassword")
    public ResponseEntity<?> resetPassword(HttpServletRequest request, @RequestBody String email){
        if(this.service.resetPassword(email, request))
            return ResponseEntity.ok().build();
        return ResponseEntity.notFound().build();
    }

    //Rotta raggiunta tramite il link presente nella email per la modifica della password
    @Operation(description = "Redirect a pagina per il cambio password. Rotta raggiunta tramite il link nella email di richiesta password")
    @GetMapping("/changePassword")
    public void showChangePasswordPage(HttpServletResponse httpServletResponse, @RequestParam("token") String token) throws IOException {
        if(!this.service.showChangePasswordPage(token)){
            httpServletResponse.sendRedirect("http://localhost:4200/login"); //In produzione cambiare l'indirizzo. In generale impostalo dalle properties
            return;
        }
        httpServletResponse.sendRedirect("http://localhost:4200/updatePassword?token=" + token);
    }

    //Rotta utilizzato per il salvataggio di una nuova password dopo aver richiesto ed utilizzato l'email di conferma
    @Operation(description = "Cambio della password con quella nuova indicata", security = @SecurityRequirement(name = "bearerAuth"))
    @PutMapping("/savePassword")
    public ResponseEntity<?> saveNewPassword(@RequestBody NewPasswordDto newPasswordDto){
        if(!this.service.savePassword(newPasswordDto))
            return ResponseEntity.status(401).build();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/send-invitation")
    public ResponseEntity<?> sendInvitationByEmail(@RequestBody String email, HttpServletRequest request){
        this.service.sendInvitation(email, request);
    }

    @Operation(description = "Ottenimento dell'email interna al token indicato", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/getEmail")
    public ResponseEntity<String> getEmailFromTkn(@RequestBody String token){
        System.out.println("AO GUARDA: " + token);
        String userEmail = this.service.getEmailFromTkn(token);
        return ResponseEntity.ok(userEmail);
    }
}
