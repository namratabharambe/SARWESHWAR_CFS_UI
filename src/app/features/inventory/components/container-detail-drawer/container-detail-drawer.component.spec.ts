import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContainerDetailDrawerComponent } from './container-detail-drawer.component';

describe('ContainerDetailDrawerComponent', () => {
  let component: ContainerDetailDrawerComponent;
  let fixture: ComponentFixture<ContainerDetailDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContainerDetailDrawerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ContainerDetailDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create ContainerDetailDrawerComponent', () => {
    expect(component).toBeTruthy();
  });
});
