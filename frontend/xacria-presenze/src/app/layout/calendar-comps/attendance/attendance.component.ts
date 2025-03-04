import { Component, ChangeDetectionStrategy, ViewChild, TemplateRef, OnInit} from '@angular/core';
import { NgbAlert, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Calendar, CalendarOptions, DayCellContentArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Renderer2, ElementRef } from '@angular/core';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { ChangeDetectorRef } from '@angular/core';
import { faPlus, faCalendarMinus, faBriefcase, faX, faCoffee, faMinus, faRoute, faPenToSquare, faBell, faArrowRight, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import { hoursValidators } from '../../validators/hours.validators';
import { datesValidators } from '../../validators/dates.validators';
import { projects, request_types, monthNamesIt, monthNamesEn  } from '../const-vars';
/* import { fi } from 'date-fns/locale'; */
import { AttendanceControllerService, calendar, working_trip } from '../../shared/services/attendance-controller.service';
import { CalendarView } from 'angular-calendar';
import { WorkingTripModalComponent } from '../modals/working-trip-modal/working-trip-modal.component';
import { ModalComponent } from '../modals/modalComponent';
import { AvailabilityModalComponent } from '../modals/availability-modal/availability-modal.component';
import { RequestModalComponent } from '../modals/request-modal/request-modal.component';
import { DayworkModalComponent } from '../modals/daywork-modal/daywork-modal.component';
import { weekDayNamesIt, weekDayNamesEn } from '../const-vars';
import { CalendarAvailabilityEntry, CalendarDayWorkEntry, CalendarEntryType, CalendarRequestEntry, CalendarWorkingTripEntry } from '../../interfaces';

@Component({
  selector: 'app-attendance',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./attendance.component.scss'],
  templateUrl: './attendance.component.html',
})
export class AttendanceComponent implements OnInit{
  viewDate: Date = new Date();
  events = [];
  view: CalendarView = CalendarView.Month;
  @ViewChild("working_trip_modal") workingTripModal!: WorkingTripModalComponent;
  @ViewChild("availability_modal") availabilityModal!: AvailabilityModalComponent;
  @ViewChild("request_modal") requestModal!: RequestModalComponent;
  @ViewChild("daywork_modal") dayworkModal!: DayworkModalComponent;
  dayClicked: Date = new Date();
  faIcons: any = faIcons;
  weekDayNames !: string[];
  monthNames !: string[];
  calendarEntries!: any[];
  CalendarEntryType = CalendarEntryType;

  //varibili per server mock
  availabilityEntries: CalendarAvailabilityEntry[] = [
    {date_from: new Date("2025-02-18"), date_to: new Date("2025-02-21"), project: ""},
    {date_from: new Date("2025-02-17"), date_to: new Date("2025-02-20"), project: ""},
    {date_from: new Date("2025-02-28"), date_to: new Date("2025-03-02"), project: ""}
  ]
  requestEntries: CalendarRequestEntry[] = [
    {date_from: new Date("2025-02-18"), date_to: new Date("2025-02-21"), request_type: "Malattia", time_from: "10:00", time_to: "12:00"},
    {date_from: new Date("2025-02-14"), date_to: new Date("2025-02-19"), request_type: "Congedo", time_from: "09:00", time_to: "16:00"}
  ]
  workingTripEntries: CalendarWorkingTripEntry[] = [
    {date_from: new Date("2025-02-18"), date_to: new Date("2025-02-21")},
    {date_from: new Date("2025-02-14"), date_to: new Date("2025-02-19")}
  ]
  dayWorkEntries: CalendarDayWorkEntry[] = [
    {date_from: new Date("2025-02-13"), date_to: new Date("2025-02-19"), hour_from: "10:00", hour_to: "12:00", project: "X2"},
    {date_from: new Date("2025-02-17"), date_to: new Date("2025-02-24"), hour_from: "10:00", hour_to: "12:00", project: "X2"}
  ]

  constructor(){
    this.weekDayNames = weekDayNamesIt;
    this.monthNames = monthNamesIt;
  }

  ngOnInit(): void {

  }

  private changeMonth(shift: number): Date{
    return new Date(this.viewDate.setMonth(this.viewDate.getMonth() + shift))
  }

  previous(): void{
    this.viewDate = this.changeMonth(-1);
  }

  next(): void{
    this.viewDate = this.changeMonth(+1);
  }

  openAddModal(modal: ModalComponent): void{
    modal.open();
  }

  setDateForModals(dayEvent: any){
    console.log("PROVA", dayEvent);
    this.dayClicked = dayEvent.day.date;
    console.log("CONTROLLA IL DAYCLICKED", this.dayClicked)
  }

  fromDateToModalTitle(date: Date){
    const month: string = monthNamesIt[date.getMonth()];
    const day: string = date.getDate().toString();
    const year: string = date.getFullYear().toString();
    const dayWord: string = this.weekDayNames[date.getDay()];
    return day + " " + month + " " + year + " - " + dayWord;
  }
}

export const faIcons = {
  plus : faPlus,
  minus : faMinus,
  briefcase: faBriefcase,
  calendar: faCalendarMinus,
  xSimbol: faX,
  route: faRoute,
  request: faPenToSquare,
  bell: faBell,
  arrowRight: faArrowRight,
  arrowLeft: faArrowLeft
}
