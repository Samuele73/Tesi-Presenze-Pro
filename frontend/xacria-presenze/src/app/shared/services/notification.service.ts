import { Injectable } from '@angular/core';
import { Stomp, Client, IMessage } from '@stomp/stompjs';
import { BehaviorSubject } from 'rxjs';
import * as SockJS from 'sockjs-client';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notifSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  private stompClient!: Client;

  constructor() {}

  get $notif(){return this.notifSubject.asObservable();}

  connect(userEmail: string) {
    // Cambia la parte di dominio con una variabile di ambiente in produzione
    const ws = new SockJS('http://localhost:8080/ws');

    this.stompClient = Stomp.over(() => ws as any);

    this.stompClient.debug = () => {};

    this.stompClient.onConnect = () => {
      console.log('STOMP connected');

      this.stompClient.subscribe(
        `/topic/notifications/${userEmail}`,
        (msg: IMessage) => {
          const payload = JSON.parse(msg.body);
          console.log('NOTIFICA:', payload.message);
          this.notifSubject.next(true);
        }
      );
    };

    this.stompClient.onStompError = (frame) =>
      console.error('Errore STOMP', frame);

    this.stompClient.activate();
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }

  readNotif(){
    this.notifSubject.next(false);
  }
}
