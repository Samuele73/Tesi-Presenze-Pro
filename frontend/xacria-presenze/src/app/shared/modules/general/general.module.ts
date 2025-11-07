import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectLangComponent } from '../../components/select-lang/select-lang.component';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { httpTranslateLoader } from 'src/app/app.module';
import { HttpClient } from '@angular/common/http';
import { FormErrorComponent } from 'src/app/form-error/form-error.component';
import { CardComponent } from '../../components/card/card.component';
import { ListInteractionComponent } from '../../components/list-interaction/list-interaction.component';
import { NgbCollapseModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { CardListWrapperComponent } from '../../components/card-list-wrapper/card-list-wrapper.component';
import { CardBadgeComponent } from '../../components/card-badge/card-badge.component';
import { ProfileComponent } from '../../components/profile/profile.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '../../components/button/button.component';
import { NgbOptionsComponent } from '../../components/ngb-options/ngb-options.component';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [
    SelectLangComponent,
    FormErrorComponent,
    CardComponent,
    ListInteractionComponent,
    CardListWrapperComponent,
    CardBadgeComponent,
    ProfileComponent,
    ButtonComponent,
    NgbOptionsComponent
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
    NgbCollapseModule,
    ReactiveFormsModule,
    NgbDropdownModule,
    RouterModule
  ],
  exports: [
    SelectLangComponent,
    FormErrorComponent,
    CardComponent,
    ListInteractionComponent,
    CardListWrapperComponent,
    CardBadgeComponent,
    ProfileComponent,
    ButtonComponent,
    NgbOptionsComponent
  ]
})
export class GeneralModule { }
