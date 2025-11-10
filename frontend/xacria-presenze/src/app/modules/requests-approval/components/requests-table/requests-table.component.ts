import { formatDate } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { DynamicTableColumn } from '../dynamic-table/dynamic-table.component';
import { DropdownOptions } from 'src/app/shared/components/ngb-options/ngb-options.component';

export interface RequestsTableRow {
  user: string;
  date: string | Date;
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

  columns: DynamicTableColumn[] = [];

  constructor(private readonly cdr: ChangeDetectorRef) {}

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
        field: 'date',
        label: 'Data',
        valueAccessor: (row: RequestsTableRow) =>
          this.formatDateValue(row?.date),
      },
      { field: 'type', label: 'Tipo' },
    ];

    if (this.showStatusColumn) {
      baseColumns.push({ field: 'status', label: 'Stato' });
    }

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

  private formatDateValue(value: string | Date | undefined): string {
    if (!value) {
      return '—';
    }
    try {
      return formatDate(value, 'shortDate', 'it-IT');
    } catch {
      return `${value}`;
    }
  }
}
