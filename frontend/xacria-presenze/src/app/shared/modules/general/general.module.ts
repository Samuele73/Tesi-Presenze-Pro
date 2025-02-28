import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectLangComponent } from '../../components/select-lang/select-lang.component';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { httpTranslateLoader } from 'src/app/app.module';
import { HttpClient } from '@angular/common/http';
import { FormErrorComponent } from 'src/app/form-error/form-error.component';



@NgModule({
  declarations: [
    SelectLangComponent,
    FormErrorComponent
  ],
  imports: [
    CommonModule,
    TranslateModule.forChild({
      loader: {
          provide: TranslateLoader,
          useFactory: httpTranslateLoader,
          deps: [HttpClient]
      },
      extend: true
    }),
  ],
  exports: [
    SelectLangComponent,
    FormErrorComponent
  ]
})
export class GeneralModule { }
