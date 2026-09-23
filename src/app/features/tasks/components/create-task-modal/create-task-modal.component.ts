import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DropdownComponent, DropdownOption } from 'shared/components/molecules/dropdown/dropdown.component';
import { TranslatePipe } from 'shared/pipes';
import { CreateTaskFormData, TaskPriority, TaskType } from 'shared/types/task/task.interface';

@Component({
  selector: 'app-create-task-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent, TranslatePipe],
  templateUrl: './create-task-modal.component.html',
  styleUrls: ['./create-task-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateTaskModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly close = output<void>();
  public readonly taskCreated = output<CreateTaskFormData>();

  // Form Signals
  public readonly selectedTaskType = signal<TaskType>('Import');
  public readonly containerNo = signal<string>('');
  public readonly sizeType = signal<string>("40' HC");
  public readonly fromLocation = signal<string>('GATE-01');
  public readonly toLocation = signal<string>('BLOCK C / 04-02');
  public readonly equipment = signal<string>('RS-07');
  public readonly operator = signal<string>('Ramesh Kumar');
  public readonly bookingNo = signal<string>('');
  public readonly priority = signal<TaskPriority>('High');
  public readonly slaMinutes = signal<number>(45);
  public readonly cargoType = signal<string>('General Cargo');
  public readonly grossWeight = signal<string>('24,500 KG');
  public readonly sealNo = signal<string>('');
  public readonly isHazardous = signal<boolean>(false);
  public readonly notes = signal<string>('');

  // Form validation error signal
  public readonly errorMessage = signal<string>('');

  public readonly taskTypes: { type: TaskType; icon: string; label: string }[] = [
    { type: 'Import', icon: 'input', label: 'Import' },
    { type: 'Export', icon: 'output', label: 'Export' },
    { type: 'Yard Move', icon: 'local_shipping', label: 'Yard Move' },
    { type: 'Stack', icon: 'layers', label: 'Stack / Re-stack' },
    { type: 'Gate Out', icon: 'logout', label: 'Gate Out' },
    { type: 'Inspection', icon: 'verified', label: 'Customs Inspect' },
  ];

  public readonly sizeOptions = [
    { value: "20' GP", label: "20' General Purpose (20' GP)" },
    { value: "40' GP", label: "40' General Purpose (40' GP)" },
    { value: "40' HC", label: "40' High Cube (40' HC)" },
    { value: "45' HC", label: "45' High Cube (45' HC)" },
    { value: "20' OT", label: "20' Open Top" },
    { value: "40' RF", label: "40' Reefer (Temperature Controlled)" },
  ];

  public readonly locationOptions = [
    { value: 'GATE-01', label: 'GATE-01 (Main Inbound Gate)' },
    { value: 'GATE-02', label: 'GATE-02 (Outbound Gate 2)' },
    { value: 'GATE-03', label: 'GATE-03 (Express Gate 3)' },
    { value: 'BLOCK A / 02-05', label: 'BLOCK A / 02-05 (Yard Block A)' },
    { value: 'BLOCK B / 06-03', label: 'BLOCK B / 06-03 (Yard Block B)' },
    { value: 'BLOCK C / 04-02', label: 'BLOCK C / 04-02 (Yard Block C)' },
    { value: 'BLOCK D / 01-04', label: 'BLOCK D / 01-04 (Holding Yard D)' },
    { value: 'BLOCK E / 03-06', label: 'BLOCK E / 03-06 (Heavy Staging E)' },
    { value: 'BLOCK F / 01-01', label: 'BLOCK F / 01-01 (Block F)' },
    { value: 'INSPECT-BAY-1', label: 'INSPECT-BAY-1 (Customs Examination)' },
    { value: 'RAIL-SIDING-01', label: 'RAIL-SIDING-01 (Rail Logistics)' },
  ];

  public readonly equipmentOptions = [
    { value: 'RS-07', label: 'RS-07 (Reach Stacker - Heavy 45T)' },
    { value: 'RS-05', label: 'RS-05 (Reach Stacker)' },
    { value: 'RS-01', label: 'RS-01 (Reach Stacker)' },
    { value: 'RTG-01', label: 'RTG-01 (Rubber Tired Gantry 01)' },
    { value: 'RTG-02', label: 'RTG-02 (Rubber Tired Gantry 02)' },
    { value: 'RTG-03', label: 'RTG-03 (Rubber Tired Gantry 03)' },
    { value: 'FLT-01', label: 'FLT-01 (Heavy Forklift 01)' },
    { value: 'FLT-02', label: 'FLT-02 (Heavy Forklift 02)' },
  ];

  public readonly operatorOptions = [
    { value: 'Ramesh Kumar', label: 'Ramesh Kumar (Lead Operator - Shift A)' },
    { value: 'Suresh Patel', label: 'Suresh Patel (RTG Senior Specialist)' },
    { value: 'Vikram Singh', label: 'Vikram Singh (Equipment Operator)' },
    { value: 'Anil Deshmukh', label: 'Anil Deshmukh (Yard Master)' },
    { value: 'Deepak Sharma', label: 'Deepak Sharma (Reach Stacker Driver)' },
  ];

  public readonly priorityOptions: DropdownOption[] = [
    { value: 'Critical', label: '⚡ Critical / Expedited' },
    { value: 'High', label: '🔴 High Priority' },
    { value: 'Medium', label: '🟠 Medium Priority' },
    { value: 'Low', label: '🟢 Low Priority' },
  ];

  public readonly slaOptions: DropdownOption[] = [
    { value: 15, label: '15 Minutes (Urgent)' },
    { value: 30, label: '30 Minutes' },
    { value: 45, label: '45 Minutes (Standard)' },
    { value: 60, label: '60 Minutes' },
    { value: 90, label: '90 Minutes' },
  ];

  public selectTaskType(type: TaskType): void {
    this.selectedTaskType.set(type);

    // Auto-populate sensible defaults based on task type
    if (type === 'Import') {
      this.fromLocation.set('GATE-01');
      this.toLocation.set('BLOCK C / 04-02');
      this.equipment.set('RS-07');
    } else if (type === 'Export') {
      this.fromLocation.set('BLOCK A / 02-05');
      this.toLocation.set('GATE-02');
      this.equipment.set('RTG-03');
    } else if (type === 'Yard Move') {
      this.fromLocation.set('BLOCK B / 06-03');
      this.toLocation.set('BLOCK D / 01-04');
      this.equipment.set('FLT-02');
    } else if (type === 'Stack') {
      this.fromLocation.set('BLOCK D / 02-02');
      this.toLocation.set('BLOCK D / 05-03');
      this.equipment.set('RS-02');
    } else if (type === 'Gate Out') {
      this.fromLocation.set('BLOCK F / 01-01');
      this.toLocation.set('GATE-02');
      this.equipment.set('RS-01');
    } else if (type === 'Inspection') {
      this.fromLocation.set('BLOCK C / 02-01');
      this.toLocation.set('INSPECT-BAY-1');
      this.equipment.set('RS-07');
    }
  }

  public onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }

  public submitTask(): void {
    const cNo = this.containerNo().trim().toUpperCase();
    if (!cNo) {
      this.errorMessage.set('Container Number is required.');
      return;
    }

    if (this.fromLocation() === this.toLocation()) {
      this.errorMessage.set('Origin and Destination locations must be different.');
      return;
    }

    this.errorMessage.set('');

    const formData: CreateTaskFormData = {
      taskType: this.selectedTaskType(),
      containerNo: cNo,
      sizeType: this.sizeType(),
      fromLocation: this.fromLocation(),
      toLocation: this.toLocation(),
      equipment: this.equipment(),
      operator: this.operator(),
      bookingNo: this.bookingNo().trim() || `BKGS-${Math.floor(100000 + Math.random() * 900000)}`,
      priority: this.priority(),
      slaMinutes: Number(this.slaMinutes()),
      cargoType: this.cargoType(),
      grossWeight: this.grossWeight(),
      sealNo: this.sealNo(),
      isHazardous: this.isHazardous(),
      notes: this.notes(),
    };

    this.taskCreated.emit(formData);
    this.resetForm();
    this.close.emit();
  }

  public resetForm(): void {
    this.containerNo.set('');
    this.bookingNo.set('');
    this.sealNo.set('');
    this.notes.set('');
    this.isHazardous.set(false);
    this.errorMessage.set('');
    this.selectTaskType('Import');
  }
}
