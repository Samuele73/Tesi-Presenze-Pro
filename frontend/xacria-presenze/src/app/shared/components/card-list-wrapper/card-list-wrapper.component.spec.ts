import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardListWrapperComponent } from './card-list-wrapper.component';

describe('CardListWrapperComponent', () => {
  let component: CardListWrapperComponent;
  let fixture: ComponentFixture<CardListWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardListWrapperComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardListWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
