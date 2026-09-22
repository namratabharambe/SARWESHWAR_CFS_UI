import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TasksComponent } from './tasks.component';
import { TaskService } from 'shared/services/task.service';

describe('TasksComponent', () => {
  let component: TasksComponent;
  let fixture: ComponentFixture<TasksComponent>;
  let taskService: TaskService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TasksComponent],
      providers: [provideRouter([]), TaskService],
    }).compileComponents();

    fixture = TestBed.createComponent(TasksComponent);
    component = fixture.componentInstance;
    taskService = TestBed.inject(TaskService);
    fixture.detectChanges();
  });

  it('should create TasksComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should render initial KPI cards and tasks', () => {
    const kpi = taskService.kpiMetrics();
    expect(kpi.allTasks).toBeGreaterThanOrEqual(126);
    expect(taskService.paginatedTasks().length).toBeGreaterThan(0);
  });

  it('should filter tasks when status filter is updated', () => {
    taskService.setStatusFilter('In Progress');
    const filtered = taskService.filteredTasks();
    expect(filtered.every((t) => t.status === 'In Progress')).toBe(true);
  });

  it('should create a new task via createTask', () => {
    const initialCount = taskService.allTasks().length;
    const newTask = taskService.createTask({
      taskType: 'Import',
      containerNo: 'TEST 123456 7',
      sizeType: "40' HC",
      fromLocation: 'GATE-01',
      toLocation: 'BLOCK C / 04-02',
      equipment: 'RS-07',
      operator: 'Ramesh Kumar',
      bookingNo: 'BKGS-TEST',
      priority: 'High',
      slaMinutes: 45,
    });

    expect(newTask).toBeTruthy();
    expect(taskService.allTasks().length).toBe(initialCount + 1);
    expect(newTask.containerNo).toBe('TEST 123456 7');
  });

  it('should toggle selection and update selectedTaskIds signal', () => {
    const firstTask = taskService.paginatedTasks()[0];
    taskService.clearSelection();
    expect(taskService.selectedTaskIds().size).toBe(0);

    taskService.toggleTaskSelection(firstTask.id);
    expect(taskService.isTaskSelected(firstTask.id)).toBe(true);
  });
});
