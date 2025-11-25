import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import {AbstractControl} from '@angular/forms'

@Component({
  selector: 'app-form-error',
  templateUrl: './form-error.component.html',
  styleUrls: ['./form-error.component.scss']
})
export class FormErrorComponent {
  @Input() formControlRef?: FormControl | AbstractControl<any,any> | null;
  @Input() validator!: string;
  @Input() errorText?: string;
  @Input() styleClass?: string;
}
