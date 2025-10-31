import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectListInteractionComponent } from './project-list-interaction.component';

describe('ProjectListInteractionComponent', () => {
  let component: ProjectListInteractionComponent;
  let fixture: ComponentFixture<ProjectListInteractionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProjectListInteractionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectListInteractionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
