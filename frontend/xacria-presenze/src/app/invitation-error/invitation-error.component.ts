import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-invitation-error',
  templateUrl: './invitation-error.component.html',
  styleUrls: ['./invitation-error.component.scss'],
})
export class InvitationErrorComponent implements OnInit {
  public errorTitle: string = '';
  public errorMessage: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const reason = this.route.snapshot.queryParams['reason'];
    switch (reason) {
      case 'missing-token': {
        this.errorTitle = 'Invito non presente';
        this.errorMessage = 'Per accedere alla pagina di registrazione è necessario un invito da parte di un supervisore.'
      }
    }
  }
}
