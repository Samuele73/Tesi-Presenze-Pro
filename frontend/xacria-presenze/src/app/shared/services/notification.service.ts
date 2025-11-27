import { Injectable } from '@angular/core';
import { Client, IMessage, Stomp } from '@stomp/stompjs';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject } from 'rxjs';
import SockJS from 'sockjs-client/dist/sockjs.min.js';
import { UserService } from 'src/generated-client';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {

  constructor(
    private toastrService: ToastrService,
    private authService: AuthService
  ) {
    this.notifSubject.next(
      sessionStorage.getItem('isNotified') === 'true'
        ? 'Hai nuove notifiche'
        : null
    );
  }

  private stompClient!: Client;
  private notifSubject = new BehaviorSubject<string | null>(null);

  get $notif() {
    return this.notifSubject.asObservable();
  }

  connect(userEmail: string) {

    const ws = new SockJS('http://localhost:8080/ws');

    this.stompClient = Stomp.over(() => ws);

    // disable verbose logs
    this.stompClient.debug = () => {};

    this.stompClient.onConnect = () => {
      console.log("STOMP connected!");

      // Notifiche
      this.stompClient.subscribe(
        `/topic/notifications/${userEmail}`,
        (msg: IMessage) => {
          const payload = JSON.parse(msg.body);
          console.log("NOTIFICA:", payload.message);
          this.notifSubject.next(payload.message);
        }
      );

      // Token aggiornato
      this.stompClient.subscribe(
        `/topic/token-updates/${userEmail}`,
        (msg: IMessage) => {
          const payload = JSON.parse(msg.body);
          console.log("TOKEN UPDATE:", payload);

          if (payload.event === "TOKEN_INVALIDATED") {
            /* this.authService.refreshToken(); */
            this.authService.refreshToken();
            this.toastrService.info("Il tuo ruolo è cambiato. Token aggiornato!");
          }
        }
      );
    };

    this.stompClient.onStompError = (frame) => {
      console.error("Errore STOMP", frame);
    };

    this.stompClient.activate();
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }

  readNotif() {
    this.notifSubject.next(null);
  }
}
