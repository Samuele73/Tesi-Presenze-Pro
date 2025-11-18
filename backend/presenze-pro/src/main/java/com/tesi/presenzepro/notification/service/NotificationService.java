package com.tesi.presenzepro.notification.service;

import com.tesi.presenzepro.notification.model.NotificationPayload;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public void send(String userEmail, String message) {
        NotificationPayload payload = new NotificationPayload(message);

        messagingTemplate.convertAndSend(
                "/topic/notifications/" + userEmail,
                payload
        );
    }
}
