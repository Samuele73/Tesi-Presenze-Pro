import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { RequestsTableRow } from '../requests-table/requests-table.component';

@Component({
  selector: 'app-requests-approval-page',
  templateUrl: './requests-approval-page.component.html',
  styleUrls: ['./requests-approval-page.component.scss']
})
export class RequestsApprovalPageComponent implements OnInit {
  openRequests: RequestsTableRow[] = [];
  closedRequests: RequestsTableRow[] = [];
  loading = false;
  activeTab: 'open' | 'closed' = 'open';

  ngOnInit(): void {
    this.simulateRequestsFetch();
  }

  getNonPrivilegedUserRequests(): void{

  }

  getRequests(): void{
    
  }

  private simulateRequestsFetch(): void {
    this.loading = true;

    forkJoin({
      open: this.mockOpenRequests(),
      closed: this.mockClosedRequests(),
    }).subscribe({
      next: ({ open, closed }) => {
        this.openRequests = open;
        this.closedRequests = closed;
      },
      error: () => {
        this.openRequests = [];
        this.closedRequests = [];
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  private mockOpenRequests() {
    const sample: RequestsTableRow[] = [
      { user: 'giulia.rossi@example.com', date: '2025-02-03', type: 'Ferie' },
      { user: 'marco.bianchi@example.com', date: '2025-02-05', type: 'Permesso' },
      { user: 'luca.conti@example.com', date: '2025-02-06', type: 'Malattia' },
      { user: 'sara.verdi@example.com', date: '2025-02-07', type: 'Congedo' },
      { user: 'andrea.neri@example.com', date: '2025-02-08', type: 'Trasferta' },
      { user: 'chiara.gallo@example.com', date: '2025-02-09', type: 'Permesso' },
      { user: 'davide.riva@example.com', date: '2025-02-10', type: 'Ferie' },
      { user: 'francesca.moretti@example.com', date: '2025-02-11', type: 'Congedo' },
      { user: 'giovanni.sala@example.com', date: '2025-02-12', type: 'Malattia' },
      { user: 'irene.longo@example.com', date: '2025-02-13', type: 'Ferie' },
      { user: 'leonardo.pini@example.com', date: '2025-02-14', type: 'Trasferta' },
      { user: 'martina.serra@example.com', date: '2025-02-15', type: 'Permesso' },
    ];
    return of(sample).pipe(delay(600));
  }

  private mockClosedRequests() {
    const sample: RequestsTableRow[] = [
      { user: 'paolo.ricci@example.com', date: '2025-01-20', type: 'Ferie', status: 'Approvata' },
      { user: 'selene.danti@example.com', date: '2025-01-18', type: 'Permesso', status: 'Rifiutata' },
      { user: 'tommaso.vitale@example.com', date: '2025-01-17', type: 'Malattia', status: 'Approvata' },
      { user: 'ugo.fontana@example.com', date: '2025-01-16', type: 'Congedo', status: 'Approvata' },
      { user: 'valentina.costa@example.com', date: '2025-01-15', type: 'Trasferta', status: 'Approvata' },
      { user: 'walter.righi@example.com', date: '2025-01-14', type: 'Permesso', status: 'Rifiutata' },
      { user: 'ylenia.serra@example.com', date: '2025-01-13', type: 'Malattia', status: 'Approvata' },
      { user: 'zeno.farina@example.com', date: '2025-01-12', type: 'Congedo', status: 'Approvata' },
    ];
    return of(sample).pipe(delay(800));
  }
}
