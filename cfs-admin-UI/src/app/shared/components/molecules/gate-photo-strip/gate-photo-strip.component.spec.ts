import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GatePhotoStripComponent, GateCameraPhoto } from './gate-photo-strip.component';

describe('GatePhotoStripComponent', () => {
  let component: GatePhotoStripComponent;
  let fixture: ComponentFixture<GatePhotoStripComponent>;

  const mockPhotos: GateCameraPhoto[] = [
    { label: 'Front OCR', color: '#c9842a', tag: 'MSC' },
    { label: 'Left Side ISO', color: '#c9842a', tag: 'MSC' },
    { label: 'Right Side ISO', color: '#c9842a', tag: 'MSC' },
    { label: 'Rear Doors', color: '#c9842a', tag: 'MSC' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GatePhotoStripComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GatePhotoStripComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render up to maxPhotos photos', () => {
    fixture.componentRef.setInput('photos', mockPhotos);
    fixture.componentRef.setInput('maxPhotos', 4);
    fixture.detectChanges();
    expect(component.visiblePhotos().length).toBe(4);
  });

  it('should emit photoClick when photo is clicked', () => {
    let clicked: any = null;
    component.photoClick.subscribe((evt) => (clicked = evt));

    fixture.componentRef.setInput('photos', mockPhotos);
    fixture.detectChanges();

    component.onPhotoClick(mockPhotos[1], 1, new MouseEvent('click'));
    expect(clicked).toEqual({ photo: mockPhotos[1], index: 1 });
  });
});
