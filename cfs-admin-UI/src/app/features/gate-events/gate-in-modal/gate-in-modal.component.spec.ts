import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GateInModalComponent } from './gate-in-modal.component';

describe('GateInModalComponent', () => {
  let component: GateInModalComponent;
  let fixture: ComponentFixture<GateInModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GateInModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GateInModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should display the modal when isOpen is true', () => {
    const modalEl = fixture.nativeElement.querySelector('.modal-window');
    expect(modalEl).toBeTruthy();
    const titleEl = fixture.nativeElement.querySelector('.page-title');
    expect(titleEl.textContent).toContain('Import Gate In');
  });

  it('should validate container number before adding to table', () => {
    component.addItemToTable();
    expect(component.errorMessage()).toContain('Container No is required');
    expect(component.tableItems().length).toBe(0);
  });

  it('should add item to table when valid container no and ISO code are provided', () => {
    component.containerNo.set('MSCU 123456 7');
    component.isoCode.set('42G1');
    component.eirWeight.set('28000');
    component.addItemToTable();

    expect(component.errorMessage()).toBe('');
    expect(component.tableItems().length).toBe(1);
    expect(component.tableItems()[0].containerNo).toBe('MSCU 123456 7');
    expect(component.tableItems()[0].isoCode).toBe('42G1');
  });

  it('should remove item from table when removeTableItem is called', () => {
    component.containerNo.set('MSCU 123456 7');
    component.isoCode.set('42G1');
    component.addItemToTable();
    expect(component.tableItems().length).toBe(1);

    const itemId = component.tableItems()[0].id;
    component.removeTableItem(itemId);
    expect(component.tableItems().length).toBe(0);
  });

  it('should reset the form when resetForm is called', () => {
    component.containerNo.set('TEST12345');
    component.isoCode.set('22G1');
    component.remarks.set('Test note');
    component.resetForm();

    expect(component.containerNo()).toBe('');
    expect(component.isoCode()).toBe('');
    expect(component.remarks()).toBe('');
    expect(component.tableItems().length).toBe(0);
  });

  it('should emit close when close button or backdrop is clicked', () => {
    let closed = false;
    component.close.subscribe(() => {
      closed = true;
    });

    const closeBtn = fixture.nativeElement.querySelector('.btn-close-modal');
    closeBtn.click();
    expect(closed).toBe(true);
  });

  it('should emit save when submitForm is called with valid data', () => {
    let saved = false;
    component.save.subscribe(() => {
      saved = true;
    });

    component.containerNo.set('MSCU 999999 9');
    component.isoCode.set('42G1');
    component.submitForm();

    expect(saved).toBe(true);
  });
});
