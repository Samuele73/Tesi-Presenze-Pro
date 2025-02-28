import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ElementRef, HostListener } from '@angular/core';
import { Input } from '@angular/core';
@Component({
  selector: 'app-select-lang',
  templateUrl: './select-lang.component.html',
  styleUrls: ['./select-lang.component.scss']
})
export class SelectLangComponent {
  defaultLang: string = "it";
  usedLang?: string;
  isOpen: boolean = false;
  @Input() top_value?: string = "45px";

  constructor (private translateService: TranslateService, private elementRef: ElementRef){
    this.usedLang = translateService.currentLang || this.defaultLang;
  }

  triggerMenu(){
    this.isOpen = !this.isOpen;
    console.log(this.isOpen);
  }

  switchLang(){
    if(this.usedLang === "it")
      this.usedLang = "en";
    else
      this.usedLang = "it";
    this.translateService.use(this.usedLang);
    localStorage.setItem("lang", this.usedLang);
    this.isOpen = !this.isOpen;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
