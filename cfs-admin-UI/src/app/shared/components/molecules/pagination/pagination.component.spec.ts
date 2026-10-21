import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  it('keeps the chosen rows-per-page selected after the list empties and refills (e.g. switching tabs)', () => {
    const fixture = TestBed.createComponent(PaginationComponent);
    const set = (k: string, v: unknown) => fixture.componentRef.setInput(k, v);
    set('pageSizeOptions', [10, 15, 25, 50, 100]);
    set('pageSize', 25);
    set('totalItems', 120);
    fixture.detectChanges();
    const select = () => fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(select().value).toBe('25');

    // Tab switch: list is empty while loading, then refills
    set('totalItems', 0);
    fixture.detectChanges();
    set('totalItems', 80);
    fixture.detectChanges();
    expect(select().value).toBe('25');
    expect(fixture.nativeElement.textContent).toContain('Showing 1 to 25 of 80');
  });
});
