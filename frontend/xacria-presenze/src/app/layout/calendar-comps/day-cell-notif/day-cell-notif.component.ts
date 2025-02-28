import { Component, Input, OnChanges, OnInit, SimpleChanges, TemplateRef } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { CalendarEntryType } from '../../interfaces';
import { ViewChild } from '@angular/core';
import { WorkingTripModalComponent } from '../modals/working-trip-modal/working-trip-modal.component';
import { AvailabilityModalComponent } from '../modals/availability-modal/availability-modal.component';
import { RequestModalComponent } from '../modals/request-modal/request-modal.component';
import { DayworkModalComponent } from '../modals/daywork-modal/daywork-modal.component';
import { ModalComponent } from '../modals/modalComponent';
import { DateFormatService } from 'src/app/shared/services/date-format.service';

@Component({
  selector: 'app-day-cell-notif',
  templateUrl: './day-cell-notif.component.html',
  styleUrls: ['./day-cell-notif.component.scss']
})
export class DayCellNotifComponent implements OnInit, OnChanges{
  @Input() icon!: IconDefinition;
  @Input() text!: string;
  @Input() notifType!: CalendarEntryType;
  @Input() date?: Date;
  @Input() dateString?: string;
  @Input() modalCalendarEntries!: any[];
  @Input() modalModify!: boolean;
  //utilizzati per la selezione della corretta modale
  @ViewChild('modal') modal!: ModalComponent;
  @ViewChild('dayworkTemplate') dayworkTemplate!: TemplateRef<DayworkModalComponent>;
  @ViewChild('requestTemplate') requestTemplate!: TemplateRef<RequestModalComponent>;
  @ViewChild('workingTripTemplate') workingTripTemplate!: TemplateRef<WorkingTripModalComponent>;
  @ViewChild('availabilityTemplate') availabilityTemplate!: TemplateRef<AvailabilityModalComponent>;
  CalendarEntryType = CalendarEntryType;
  notifs: number = 0;

  constructor(private dateFormat: DateFormatService){}

  get currentDay(){return this.date!.getDate();}
  get currentMonth(){return this.date!.getMonth();}

  ngOnInit(): void {
  }

  //Necessario che sia onChanges dato che se cambia l'array in input deve essere effettuato un ulteriore controllo
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['modalCalendarEntries']) {
      this.syncNotifs();
    }
  }

  getTemplate(): TemplateRef<any> {
    switch (this.notifType) {
      case CalendarEntryType.WORKING_DAY:
        return this.dayworkTemplate;
      case CalendarEntryType.REQUEST:
        return this.requestTemplate;
      case CalendarEntryType.WORKING_TRIP:
        return this.workingTripTemplate;
      case CalendarEntryType.AVAILABILITY:
        return this.availabilityTemplate;
    }
  }

  //Il setTimeout viene usato per dar modo ad anuglar di inizzializzare ViewChild della modale, valorizzato quando angular completa il ciclo di rendering della visita
  openModifyModal(): void{
    setTimeout(() => {
      if (this.modal) {
        this.modal.open();
      } else {
        console.warn('La modale non è ancora stata inizializzata!');
      }
    });
  }

  //Filtraggio delle entries del calendario per selezionare quelle da fare visualizzare alla modale associate, in sincronia con la data corrente, di inizio e di fine
  filterEntries(): void {
    if (!this.modalCalendarEntries || !this.date) {
      console.error("data o entries non presenti per il filtraggio per il day-cell-notif");
      return;
    }
    const current = this.dateFormat.normalizeDate(this.date);
    this.modalCalendarEntries = this.modalCalendarEntries.filter(entry =>
      current >= this.dateFormat.normalizeDate(entry.date_from) &&
      current <= this.dateFormat.normalizeDate(entry.date_to)
    );
  }


  generateNotifs(): void{
    /* if(!this.modalCalendarEntries)
      return;
    this.modalCalendarEntries.forEach((entry) => {
      console.log("la data", this.date);
      const from = entry.date_from.getDate();
      const to = entry.date_to.getDate();
      if(this.currentDay >= from && this.currentDay <= to)
        this.notifs++;
      console.log("CONTROLLA valore:::::", from, to, this.currentDay)
    }) */
   this.notifs = this.modalCalendarEntries.length;
  }

  //filtra l'array in entrata ed aggiorna il numero di notifiche
  syncNotifs(): void{
    this.filterEntries();
    this.generateNotifs();
  }
}
