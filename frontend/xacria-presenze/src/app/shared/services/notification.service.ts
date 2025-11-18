import { Injectable } from '@angular/core';
import { Client, IMessage, Stomp } from '@stomp/stompjs';
import { BehaviorSubject } from 'rxjs';
import SockJS from 'sockjs-client/dist/sockjs.min.js';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  private stompClient!: Client;

  constructor() {}

  get $notif(){return this.notifSubject.asObservable();}

  connect(userEmail: string) {

    const ws = new SockJS('http://localhost:8080/ws');

    this.stompClient = Stomp.over(() => ws);

    this.stompClient.onConnect = () => {
      console.log("STOMP connected!");

      this.stompClient.subscribe(
        `/topic/notifications/${userEmail}`,
        (msg: IMessage) => {
          const payload = JSON.parse(msg.body);
          console.log("NOTIFICA:", payload.message);
          this.notifSubject.next(true);
        }
      );
    };

    this.stompClient.onStompError = (frame) =>
      console.error("Errore STOMP", frame);

    this.stompClient.activate();
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }

  readNotif(){this.notifSubject.next(false);}
}
