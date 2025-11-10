import { Component, Input, OnChanges, SimpleChanges, TemplateRef } from '@angular/core';

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

  private _maxPages = Number.POSITIVE_INFINITY;
  private _pageSize = 10;
  @Input() set pageSize(value: number) {
    const parsed = Number(value);
    const numericValue = Number.isFinite(parsed) ? Math.floor(parsed) : NaN;
    const sanitized = Number.isFinite(numericValue)
      ? Math.min(10, Math.max(1, numericValue))
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

  currentPage = 1;
  paginatedRows: Record<string, any>[] = [];
  collectionSize = 0;
  showPaginationControls = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rows']) {
      this.currentPage = 1;
    }
    this.updatePaginatedRows();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePaginatedRows();
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
    const size = this.pageSize || 10;
    const maxItems = Number.isFinite(this.maxPages)
      ? this.maxPages * size
      : safeRows.length;
    const limitedLength = Math.min(safeRows.length, maxItems);

    const totalPages = Math.max(1, Math.ceil((limitedLength || 0) / size) || 1);
    if (this.currentPage > totalPages) {
      this.currentPage = totalPages;
    }
    const start = (this.currentPage - 1) * size;
    this.collectionSize = limitedLength;
    this.showPaginationControls = this.collectionSize > 0;
    this.paginatedRows = safeRows.slice(start, start + size);
  }
}
