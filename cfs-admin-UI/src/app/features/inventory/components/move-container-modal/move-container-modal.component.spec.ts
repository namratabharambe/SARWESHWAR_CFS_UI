import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MoveContainerModalComponent } from './move-container-modal.component';

describe('MoveContainerModalComponent', () => {
  let component: MoveContainerModalComponent;
  let fixture: ComponentFixture<MoveContainerModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoveContainerModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MoveContainerModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create MoveContainerModalComponent', () => {
    expect(component).toBeTruthy();
  });
});
