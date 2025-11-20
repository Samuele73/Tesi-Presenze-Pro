import { Component, Input } from '@angular/core';
import { faDownload } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-excel-button',
  templateUrl: './excel-button.component.html',
  styleUrls: ['./excel-button.component.scss']
})
export class ExcelButtonComponent {
  @Input() buttonClass: string = '';
  faDownload = faDownload
}
