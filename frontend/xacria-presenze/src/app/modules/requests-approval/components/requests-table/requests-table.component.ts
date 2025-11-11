import { formatDate } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { DynamicTableColumn } from '../dynamic-table/dynamic-table.component';
import { DropdownOptions } from 'src/app/shared/components/ngb-options/ngb-options.component';
import { AuthService } from 'src/app/shared/services/auth.service';

export interface RequestsTableRow {
  id?: string;
  user: string;
  dateFrom?: string | Date;
  timeFrom?: string;
  dateTo?: string | Date;
  timeTo?: string;
  type: string;
  status?: string;
}

@Component({
  selector: 'app-requests-table',
  templateUrl: './requests-table.component.html',
  styleUrls: ['./requests-table.component.scss'],
})
export class RequestsTableComponent implements OnChanges, AfterViewInit {
  @ViewChild('actionsTemplate', { static: true })
  actionsTemplate?: TemplateRef<any>;
  @ViewChild('userTemplate', { static: true })
  userTemplate?: TemplateRef<any>;

  @Input() data: RequestsTableRow[] = [];
  @Input() showStatusColumn = false;
  @Input() emptyMessage = 'Nessuna richiesta disponibile';
  @Input() pageSize = 10;
  @Input() maxPages = Number.POSITIVE_INFINITY;
  @Input() totalItems: number | null = null;
  @Input() currentPage = 1;
  @Input() serverPagination = false;
  @Output() pageChange = new EventEmitter<number>();

  columns: DynamicTableColumn[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['showStatusColumn'] ||
      changes['actionsTemplate'] ||
      changes['data']
    ) {
      this.buildColumns();
    }
  }

  ngAfterViewInit(): void {
    this.buildColumns();
    this.cdr.detectChanges();
  }

  private buildColumns(): void {
    const baseColumns: DynamicTableColumn[] = [
      {
        field: 'user',
        label: 'Utente',
        template: this.userTemplate,
        headerClass: 'requests-table-user-column',
        cellClass: 'requests-table-user-column',
      },
      {
        field: 'from',
        label: 'Da',
        valueAccessor: (row: RequestsTableRow) =>
          this.formatDateTime(row?.dateFrom, row?.timeFrom),
      },
      {
        field: 'to',
        label: 'A',
        valueAccessor: (row: RequestsTableRow) =>
          this.formatDateTime(row?.dateTo, row?.timeTo),
      },
      { field: 'type', label: 'Tipo' },
    ];

    if (this.showStatusColumn) {
      baseColumns.push({ field: 'status', label: 'Stato' });
    }

    if (this.authService.isPrivilegedUser())
      baseColumns.push(this.getActionsColumn());

    this.columns = baseColumns;
  }

  private getActionsColumn(): DynamicTableColumn {
    if (this.actionsTemplate) {
      return {
        field: 'actions',
        label: '',
        template: this.actionsTemplate,
      };
    }

    return {
      field: 'actions',
      label: 'Azioni',
      valueAccessor: (row: RequestsTableRow) => this.generateOptions(row),
    };
  }

  generateOptions(row: RequestsTableRow): DropdownOptions {
    return [
      {
        name: 'Modifica',
        onclick: () => console.log('Prova modifica:', row),
      },
    ];
  }

  onUserClick(row: RequestsTableRow): void {
    console.log('User clicked:', row);
  }

  onPageChanged(page: number): void {
    this.pageChange.emit(page);
  }

  private formatDateTime(
    dateValue: string | Date | undefined,
    timeValue: string | undefined
  ): string {
    if (!dateValue && !timeValue) {
      return '—';
    }
    const formattedDate = dateValue
      ? this.tryFormatDate(dateValue)
      : undefined;
    const formattedTime = timeValue?.trim();
    return [formattedDate, formattedTime].filter(Boolean).join(' ');
  }

  private tryFormatDate(value: string | Date): string {
    try {
      return formatDate(value, 'shortDate', 'it-IT');
    } catch {
      return `${value}`;
    }
  }
}
