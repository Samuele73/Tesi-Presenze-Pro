package com.tesi.presenzepro.user;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
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
@Tag(name = "Utente", description = "Operazioni relative all'utente")
public class UserController {

    private final UserService service;

    @PostMapping("/login")
    public ResponseEntity<UserAuthResponseDto> login(@RequestBody UserAuthRequestDto user){
        return ResponseEntity.ok(service.login(user));
    }

    @PostMapping("/signin")
    public ResponseEntity<?> signIn(@RequestBody UserAuthRequestDto user){
        Map<String, String> responseMessage = new HashMap<>();
        if(service.signIn(user) == null){
            responseMessage.put("message", "Errore nella registrazione dell'utente");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(responseMessage);
        }
        responseMessage.put("message", "Utente registrato con successo!");
        return ResponseEntity.ok(responseMessage);
    }

    //Aggiungere cattura exception di JWTService
    @Operation(description = "Valida il token inviato")
    @PostMapping("/secure")
    public ResponseEntity<?> validToken(@RequestBody String token){
        System.out.print("[Server msg]: validando tkn" + token + "\n");
        Map<String, Object> responseMessage = new HashMap<>();
        if(service.isTokenValid(token)){
            responseMessage.put("email", service.getEmailFromTkn(token));
            responseMessage.put("status", true);
            return ResponseEntity.ok(responseMessage);
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(false);
    }

    //Utilizzato per reperire i dati del profilo dell
    @PostMapping("/profile")
    public ResponseEntity<?> getUserProfile(@RequestBody String token){
         final User user = service.getUserProfile(token);
         if(user != null)
             return ResponseEntity.ok(user);
         return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(false);
    }

    //Implementare il metodo di aggiornamento
    @PutMapping("/profile/update")
    public ResponseEntity<?> updateUserProfile(@RequestBody User updatedUserProfile){
        System.out.println("MESSAGGIO DA PUT UPDATE:: " + updatedUserProfile);
        Map<String, Object> responseMessage = new HashMap<>();
        UserProfile newProfile = service.updateUserProfile(updatedUserProfile);
        if(newProfile == null){
            responseMessage.put("message", "Impossibile aggiornare profilo dell'utente");
            return ResponseEntity.status((HttpStatus.BAD_REQUEST)).body(responseMessage);
        }
        responseMessage.put("message", "Utente aggiornato correttamente");
        responseMessage.put("new_creds",  newProfile);
        return ResponseEntity.ok(responseMessage);
    }

    //Rotta raggiunta tramite la pagina di password dimenticata
    @Operation(description = "Richiede il reset della password. Consegue l'invio di una email")
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
            httpServletResponse.sendRedirect("http://localhost:4200/login");
            return;
        }
        httpServletResponse.sendRedirect("http://localhost:4200/updatePassword?token=" + token);
    }

    //Rotta utilizzato per il salvataggio di una nuova password dopo aver richiesto ed utilizzato l'email di conferma
    @Operation(description = "Cambio della password con quella nuova indicata")
    @PostMapping("/savePassword")
    public ResponseEntity<?> saveNewPassword(@RequestBody NewPasswordDto newPasswordDto){
        if(!this.service.savePassword(newPasswordDto))
            return ResponseEntity.status(401).build();
        return ResponseEntity.ok().build();
    }

    @Operation(description = "Ottenimento dell'email interna al token indicato")
    @PostMapping("/getEmail")
    public ResponseEntity<?> getEmailFromTkn(@RequestBody String token){
        System.out.println("AO GUARDA: " + token);
        String userEmail = this.service.getEmailFromTkn(token);
        if(this.service.getEmailFromTkn(token) == null)
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        return ResponseEntity.ok(userEmail);
    }
}
