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
  private _filters: RequestsTableFilters = { types: [], users: [] };
  @Input() set filters(value: RequestsTableFilters | null) {
    this._filters = {
      types: value?.types ? [...value.types] : [],
      users: value?.users ? [...value.users] : [],
    };
    this.selectedRequestTypes = [...this._filters.types];
    this.selectedUsers = [...this._filters.users];
    this.syncSelectedUsers();
  }
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

    if (this.authService.isPrivilegedUser()) {
      baseColumns.push(this.getActionsColumn());
      baseColumns.unshift(this.getUserColumn());
    }

    this.columns = baseColumns;
  }

  private getUserColumn(): DynamicTableColumn {
    return {
      field: 'user',
      label: 'Utente',
      template: this.userTemplate,
      headerClass: 'requests-table-user-column',
      cellClass: 'requests-table-user-column',
    };
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
        name: 'Gestisci',
        onclick: () => this.rowSelected.emit(row),
      },
    ];
  }

  onFilterChange(): void {
    const nextFilters: RequestsTableFilters = {
      types: [...(this.selectedRequestTypes ?? [])],
      users: [...(this.selectedUsers ?? [])],
    };
    this._filters = nextFilters;
    this.filtersChange.emit(nextFilters);
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
    console.log('sono stato toccato');

    this.rowSelected.emit(row as RequestsTableRow);
  }

  private formatDateTime(
    row: RequestsTableRow,
    direction: 'from' | 'to'
  ): string {
    console.log('look at row', row);
    const dateValue = direction === 'from' ? row?.dateFrom : row?.dateTo;

    if (!dateValue) {
      return '—';
    }
    if (row.type == 'TRASFERTA')
      return formatDate(dateValue, 'dd-MM-yyyy', 'en-GB');
    return formatDate(dateValue, 'dd-MM-yyyy HH:mm', 'en-GB');
  }
}
