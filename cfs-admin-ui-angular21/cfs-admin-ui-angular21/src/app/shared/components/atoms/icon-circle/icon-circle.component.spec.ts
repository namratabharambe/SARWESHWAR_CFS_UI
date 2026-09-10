import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconCircleComponent } from './icon-circle.component';

describe('IconCircleComponent', () => {
  let component: IconCircleComponent;
  let fixture: ComponentFixture<IconCircleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconCircleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IconCircleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
