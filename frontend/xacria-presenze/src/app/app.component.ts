import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'xacria-presenze';

  constructor(private translate: TranslateService) {
    const savedLang = localStorage.getItem('lang') || 'it';
    translate.addLangs(['it', 'en']);
    translate.setDefaultLang('it');
    translate.use(savedLang);
  }
}
