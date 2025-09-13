import { AfterViewInit, Component } from '@angular/core';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import { AvailabilityModalComponent } from '../modals/availability-modal/availability-modal.component';
import { RequestModalComponent } from '../modals/request-modal/request-modal.component';
import { WorkingTripModalComponent } from '../modals/working-trip-modal/working-trip-modal.component';
import { DayworkModalComponent } from '../modals/daywork-modal/daywork-modal.component';

declare var bootstrap: any;
const faIcons = { plus: faPlus, minus: faMinus };
type DistributedModalComponent =
  | AvailabilityModalComponent
  | RequestModalComponent
  | WorkingTripModalComponent;
type ModalComponentType = DistributedModalComponent | DayworkModalComponent;

@Component({
  selector: 'app-interactive-button',
  templateUrl: './interactive-button.component.html',
  styleUrls: ['./interactive-button.component.scss'],
})
export class InteractiveButtonComponent implements AfterViewInit {
  faIcons: any = faIcons;

  ngAfterViewInit(): void {
    this.initializeBootstrapTooltips();
  }

  initializeBootstrapTooltips(): void {
    const tooltipTriggerList = document.querySelectorAll('.tt');
    tooltipTriggerList.forEach(
      (el) =>
        new bootstrap.Tooltip(el, {
          container: 'body',
          customClass: 'custom-tooltip',
        })
    );
  }

  openModal(modal: ModalComponentType, date?: Date): void {
    //dayworkmodal does not have currentDate input
    if (date && !(modal instanceof DayworkModalComponent)) {
      console.log('date:', date);
      modal.currentDate = date;
      console.log('modal date:', modal.currentDate);
    }

    modal.open();
  }
}
