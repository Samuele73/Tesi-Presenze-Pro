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
import { UserRequestResponseDto } from 'src/generated-client';

export interface RequestsTableRow {
  id?: string;
  user: string;
  dateFrom?: string | Date;
  timeFrom?: string;
  dateTo?: string | Date;
  timeTo?: string;
  type: string;
  status?: string;
  original?: UserRequestResponseDto;
}

export interface RequestsTableFilters {
  types: UserRequestResponseDto.TypeEnum[];
  users: string[];
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
  private _userOptions: string[] = [];
  @Input() set userOptions(value: string[] | null) {
    if (!this.canOpenDetails) {
      return;
    }
    this._userOptions = (value ?? []).slice();
    this.syncSelectedUsers();
  }
  get userOptions(): string[] {
    return this._userOptions;
  }
  @Input() totalItems: number | null = null;
  @Input() currentPage = 1;
  @Input() serverPagination = false;
  @Output() pageChange = new EventEmitter<number>();
  @Output() rowSelected = new EventEmitter<RequestsTableRow>();
  @Output() filtersChange = new EventEmitter<RequestsTableFilters>();

  columns: DynamicTableColumn[] = [];
  canOpenDetails = this.authService.isPrivilegedUser();

  requestTypeOptions = Object.values(UserRequestResponseDto.TypeEnum).map(
    (value) => ({
      label: value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
      value,
    })
  );
  selectedRequestTypes: UserRequestResponseDto.TypeEnum[] = [];
  selectedUsers: string[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    public authService: AuthService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['showStatusColumn'] ||
      changes['actionsTemplate'] ||
      changes['data']
    ) {
      this.buildColumns();
    }
    if (this.canOpenDetails && changes['userOptions']) {
      this.syncSelectedUsers();
    } else if (!this.canOpenDetails && changes['data'] && this.data) {
      this.generateUserOptions();
    }
  }

  ngAfterViewInit(): void {
    this.buildColumns();
    this.cdr.detectChanges();
  }

  private generateUserOptions(): void {
    const extracted = this.data?.map((r) => r.user) ?? [];
    this._userOptions = Array.from(new Set(extracted));
    this.syncSelectedUsers();
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
          this.formatDateTime(row, 'from'),
      },
      {
        field: 'to',
        label: 'A',
        valueAccessor: (row: RequestsTableRow) =>
          this.formatDateTime(row, 'to'),
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

  onFilterChange(): void {
    this.filtersChange.emit({
      types: [...(this.selectedRequestTypes ?? [])],
      users: [...(this.selectedUsers ?? [])],
    });
  }

  private syncSelectedUsers(): void {
    if (!this.selectedUsers?.length) {
      return;
    }
    const allowed = new Set(this._userOptions);
    const filtered = this.selectedUsers.filter((user) => allowed.has(user));
    if (filtered.length !== this.selectedUsers.length) {
      this.selectedUsers = filtered;
      this.onFilterChange();
    }
  }

  onUserClick(row: RequestsTableRow, event?: MouseEvent): void {
    event?.stopPropagation();
    console.log('User clicked:', row);
  }

  onPageChanged(page: number): void {
    this.pageChange.emit(page);
  }

  onRowClick(row: Record<string, any>): void {
    if (!this.canOpenDetails) {
      return;
    }
    this.rowSelected.emit(row as RequestsTableRow);
  }

  private formatDateTime(
    row: RequestsTableRow,
    direction: 'from' | 'to'
  ): string {
    const dateValue = direction === 'from' ? row?.dateFrom : row?.dateTo;
    const timeValue = direction === 'from' ? row?.timeFrom : row?.timeTo;

    const { datePart, timePart: timeFromDate } =
      this.extractDateComponents(dateValue);

    if (!datePart && !timeValue) {
      return '—';
    }

    const formattedDate =
      datePart ?? (dateValue ? this.tryFormatDate(dateValue) : undefined);
    const shouldSkipTime = this.shouldHideTime(row?.type);
    if (!formattedDate || shouldSkipTime) {
      return formattedDate ?? '—';
    }

    const formattedTime =
      this.normalizeSimpleTime(timeValue) ??
      this.normalizeSimpleTime(timeFromDate);

    return formattedTime ? `${formattedDate} ${formattedTime}` : formattedDate;
  }

  private tryFormatDate(value: string | Date): string {
    try {
      return formatDate(value, 'yyyy-MM-dd', 'en-GB');
    } catch {
      return `${value}`;
    }
  }

  private extractDateComponents(value: string | Date | undefined): {
    datePart?: string;
    timePart?: string;
  } {
    if (!value) {
      return {};
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return {};
      }
      if (trimmed.includes('T')) {
        const [datePart, timePartRaw] = trimmed.split('T');
        return {
          datePart,
          timePart: this.normalizeSimpleTime(timePartRaw),
        };
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return { datePart: trimmed };
      }
    }

    try {
      const date = typeof value === 'string' ? new Date(value) : value;
      if (!date || Number.isNaN(date.getTime())) {
        return {};
      }
      return {
        datePart: formatDate(date, 'yyyy-MM-dd', 'en-GB'),
        timePart: formatDate(date, 'HH:mm', 'en-GB'),
      };
    } catch {
      return {};
    }
  }

  private normalizeSimpleTime(value: string | undefined): string | undefined {
    if (!value) {
      return undefined;
    }
    const sanitized = value.trim().replace(/Z$/i, '');
    if (!sanitized) {
      return undefined;
    }
    const colonIndex = sanitized.indexOf(':');
    if (colonIndex === -1) {
      return undefined;
    }
    const [hours, rest] = [
      sanitized.slice(0, colonIndex),
      sanitized.slice(colonIndex + 1),
    ];
    const minutes = rest.padEnd(2, '0').slice(0, 2);
    if (!/^\d{1,2}$/.test(hours) || !/^\d{2}$/.test(minutes)) {
      const hhmm = sanitized.match(/^(\d{1,2}:\d{2})/);
      return hhmm ? hhmm[1] : undefined;
    }
    return `${hours.padStart(2, '0')}:${minutes}`;
  }

  private shouldHideTime(type?: string): boolean {
    return type?.trim().toUpperCase() === 'TRASFERTA';
  }
}
