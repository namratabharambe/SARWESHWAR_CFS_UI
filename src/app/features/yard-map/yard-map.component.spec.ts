import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { YardMapComponent } from './yard-map.component';
import { YardMapService } from './yard-map.service';
import { describe, expect, it, beforeEach } from 'vitest';

describe('YardMapComponent', () => {
  let component: YardMapComponent;
  let fixture: ComponentFixture<YardMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YardMapComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(YardMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the yard map component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize slots and locations', () => {
    expect(component.allSlots().length).toBeGreaterThan(0);
    expect(component.locationOptions().length).toBeGreaterThan(0);
  });

  it('should update filter on location and cycle change', () => {
    component.onLocationChange('A-1 1');
    expect(component.filterLocation()).toBe('A-1 1');
    component.onCycleChange('Import Clearance Cycle');
    expect(component.filterCycle()).toBe('Import Clearance Cycle');
    component.resetFilters();
    expect(component.filterLocation()).toBe('');
    expect(component.filterCycle()).toBe('all');
  });
});
