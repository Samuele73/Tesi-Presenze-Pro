import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListInteractionComponent } from './list-interaction.component';

describe('ListInteractionComponent', () => {
  let component: ListInteractionComponent;
  let fixture: ComponentFixture<ListInteractionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListInteractionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListInteractionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
