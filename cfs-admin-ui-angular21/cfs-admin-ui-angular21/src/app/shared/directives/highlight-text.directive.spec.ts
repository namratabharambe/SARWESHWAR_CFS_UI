import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HighlightTextDirective } from './highlight-text.directive';

@Component({
  template: ` <span id="target" [appHighlightText]="text()" [highlightTerm]="term()"></span> `,
  standalone: true,
  imports: [HighlightTextDirective],
})
class TestHostComponent {
  public text = signal('Central Freight Station');
  public term = signal('Freight');
}

describe('HighlightTextDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should wrap matching term in <mark> tag', () => {
    const el = fixture.debugElement.query(By.css('#target')).nativeElement as HTMLElement;
    expect(el.innerHTML).toContain('<mark');
    expect(el.innerHTML).toContain('Freight</mark>');
  });

  it('should revert to plain text if term is shorter than 2 chars', () => {
    fixture.componentInstance.term.set('F');
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('#target')).nativeElement as HTMLElement;
    expect(el.innerHTML).not.toContain('<mark');
    expect(el.textContent).toBe('Central Freight Station');
  });
});
