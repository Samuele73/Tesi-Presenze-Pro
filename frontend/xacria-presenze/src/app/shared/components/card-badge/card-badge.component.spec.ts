import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardBadgeComponent } from './card-badge.component';

describe('CardBadgeComponent', () => {
  let component: CardBadgeComponent;
  let fixture: ComponentFixture<CardBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardBadgeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
