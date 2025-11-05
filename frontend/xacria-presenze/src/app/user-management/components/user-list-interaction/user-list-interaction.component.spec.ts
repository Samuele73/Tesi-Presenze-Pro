import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserLisInteractionComponent } from './user-list-interaction.component';

describe('UserLisInteractionComponent', () => {
  let component: UserLisInteractionComponent;
  let fixture: ComponentFixture<UserLisInteractionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserLisInteractionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserLisInteractionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
