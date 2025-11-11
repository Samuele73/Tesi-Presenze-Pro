import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  TemplateRef,
} from '@angular/core';
import { UserRequestResponseDto } from 'src/generated-client';

export interface DynamicTableColumn {
  field: string;
  label: string;
  valueAccessor?: (row: any) => any;
  template?: TemplateRef<any>;
  headerClass?: string;
  cellClass?: string;
}

@Component({
  selector: 'app-dynamic-table',
  templateUrl: './dynamic-table.component.html',
  styleUrls: ['./dynamic-table.component.scss'],
})
export class DynamicTableComponent implements OnChanges {
  @Input() columns: DynamicTableColumn[] = [];
  @Input() rows: Record<string, any>[] | null = [];
  @Input() emptyMessage = 'Nessun elemento disponibile';
  @Input() rowClickable = false;
  private _serverPagination = false;
  @Input() set serverPagination(value: boolean | string | number) {
    const normalized = this.toBoolean(value);
    if (normalized !== this._serverPagination) {
      this._serverPagination = normalized;
      if (!this._serverPagination) {
        this.setCurrentPageInternal(1, true);
      } else {
        this.updatePaginatedRows();
      }
    }
  }
  get serverPagination(): boolean {
    return this._serverPagination;
  }

  private _maxPages = Number.POSITIVE_INFINITY;
  private _pageSize = 10;
  @Input() set pageSize(value: number) {
    const parsed = Number(value);
    const numericValue = Number.isFinite(parsed) ? Math.floor(parsed) : NaN;
    const sanitized = Number.isFinite(numericValue)
      ? Math.max(1, numericValue)
      : 10;
    if (sanitized !== this._pageSize) {
      this._pageSize = sanitized;
      this.currentPage = 1;
      this.updatePaginatedRows();
    }
  }
  get pageSize(): number {
    return this._pageSize;
  }

  @Input() set maxPages(value: number) {
    const parsed = Number(value);
    const numericValue = Number.isFinite(parsed) ? Math.floor(parsed) : NaN;
    const sanitized = Number.isFinite(numericValue)
      ? Math.max(1, numericValue)
      : Number.POSITIVE_INFINITY;
    if (sanitized !== this._maxPages) {
      this._maxPages = sanitized;
      this.currentPage = 1;
      this.updatePaginatedRows();
    }
  }
  get maxPages(): number {
    return this._maxPages;
  }

  private _currentPage = 1;
  @Input() set currentPage(value: number | null | undefined) {
    this.setCurrentPageInternal(value, !this.serverPagination);
  }
  get currentPage(): number {
    return this._currentPage;
  }

  private _totalItems: number | null = null;
  @Input() set totalItems(value: number | null | undefined) {
    const sanitized = this.normalizeTotalItems(value);
    if (sanitized !== this._totalItems) {
      this._totalItems = sanitized;
      if (this.serverPagination) {
        this.updatePaginatedRows();
      }
    }
  }
  get totalItems(): number | null {
    return this._totalItems;
  }

  @Output() pageChange = new EventEmitter<number>();
  @Output() rowClick = new EventEmitter<Record<string, any>>();

  paginatedRows: Record<string, any>[] = [];
  collectionSize = 0;
  showPaginationControls = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rows'] && !this.serverPagination) {
      this.currentPage = 1;
    }
    this.updatePaginatedRows();
  }

  onPageChange(page: number): void {
    if (this.serverPagination) {
      this._currentPage = page;
      this.pageChange.emit(page);
      return;
    }
    this.currentPage = page;
    this.updatePaginatedRows();
  }

  handleRowClick(row: Record<string, any>): void {
    if (!this.rowClickable) {
      return;
    }
    this.rowClick.emit(row);
  }

  trackByRow(_index: number, row: Record<string, any>): any {
    return row;
  }

  getCellValue(row: Record<string, any>, column: DynamicTableColumn): any {
    if (column.template) {
      return null;
    }
    const value = column.valueAccessor
      ? column.valueAccessor(row)
      : row?.[column.field];
    return value ?? '—';
  }

  private updatePaginatedRows(): void {
    const safeRows = this.rows ?? [];
    if (this.serverPagination) {
      this.paginatedRows = safeRows;
      const total = this.totalItems ?? safeRows.length;
      this.collectionSize = Math.max(0, total);
      this.showPaginationControls = this.collectionSize > 0;
      return;
    }

    const size = this.pageSize || 10;
    const maxItems = Number.isFinite(this.maxPages)
      ? Math.min(safeRows.length, this.maxPages * size)
      : safeRows.length;
    const limitedLength = Math.max(0, maxItems);
    const totalPages = Math.max(1, Math.ceil((limitedLength || 0) / size) || 1);
    if (this.currentPage > totalPages) {
      this._currentPage = totalPages;
    }
    const start = (this.currentPage - 1) * size;
    this.collectionSize = limitedLength;
    this.showPaginationControls = this.collectionSize > 0;
    this.paginatedRows = safeRows.slice(start, start + size);
  }

  private normalizePage(value: number | null | undefined): number {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 1) {
      return Math.floor(parsed);
    }
    return 1;
  }

  private setCurrentPageInternal(
    value: number | null | undefined,
    triggerUpdate: boolean
  ): void {
    const sanitized = this.normalizePage(value);
    if (sanitized !== this._currentPage) {
      this._currentPage = sanitized;
      if (triggerUpdate) {
        this.updatePaginatedRows();
      }
      return;
    }
    if (triggerUpdate) {
      this.updatePaginatedRows();
    }
  }

  private normalizeTotalItems(value: number | null | undefined): number | null {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return Math.floor(parsed);
    }
    return null;
  }

  private toBoolean(value: boolean | string | number | undefined): boolean {
    if (typeof value === 'string') {
      return value === 'true' || value === '1';
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    return !!value;
  }
}
