import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DropdownComponent } from './dropdown.component';

describe('DropdownComponent', () => {
  let component: DropdownComponent;
  let fixture: ComponentFixture<DropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropdownComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DropdownComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', [
      { label: 'All', value: 'All' },
      { label: 'Import', value: 'Import' },
      { label: 'Export', value: 'Export' },
    ]);
    fixture.detectChanges();
  });

  it('should create DropdownComponent', () => {
    expect(component).toBeTruthy();
    expect(component.isOpen()).toBe(false);
  });

  it('should toggle open and closed states', () => {
    component.toggle();
    expect(component.isOpen()).toBe(true);

    component.toggle();
    expect(component.isOpen()).toBe(false);
  });

  it('should select an option and emit valueChange', () => {
    let emitted = '';
    component.valueChange.subscribe(val => (emitted = val));

    component.selectOption({ label: 'Import', value: 'Import' });
    expect(component.currentValue()).toBe('Import');
    expect(emitted).toBe('Import');
    expect(component.isOpen()).toBe(false);
  });

  it('should filter options based on search query', () => {
    component.searchQuery.set('exp');
    expect(component.filteredOptions().length).toBe(1);
    expect(component.filteredOptions()[0].value).toBe('Export');
  });

  it('should clear value when clear is called', () => {
    component.selectOption({ label: 'Export', value: 'Export' });
    expect(component.currentValue()).toBe('Export');

    component.clear();
    expect(component.currentValue()).toBe('');
  });
});
