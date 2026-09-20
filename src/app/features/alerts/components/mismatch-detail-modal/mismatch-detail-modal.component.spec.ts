import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MismatchDetailModalComponent } from './mismatch-detail-modal.component';

describe('MismatchDetailModalComponent', () => {
  let component: MismatchDetailModalComponent;
  let fixture: ComponentFixture<MismatchDetailModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MismatchDetailModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MismatchDetailModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create MismatchDetailModalComponent', () => {
    expect(component).toBeTruthy();
  });
});
