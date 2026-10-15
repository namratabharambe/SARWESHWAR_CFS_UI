import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DropdownComponent, DropdownOption } from 'shared/components/molecules/dropdown/dropdown.component';
import {
  AddInventoryFormData,
  ContainerFullEmpty,
  ContainerYardStatus,
} from 'shared/types/inventory/inventory.interface';

import { TranslatePipe } from 'shared/pipes';

@Component({
  selector: 'app-add-inventory-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent, TranslatePipe],
  templateUrl: './add-inventory-modal.component.html',
  styleUrls: ['./add-inventory-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddInventoryModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly close = output<void>();
  public readonly save = output<AddInventoryFormData>();

  // Form Signals
  public readonly containerNo = signal<string>('');
  public readonly sizeType = signal<string>("40' HC");
  public readonly line = signal<string>('MSK');
  public readonly fullEmpty = signal<ContainerFullEmpty>('Full');
  public readonly block = signal<string>('A');
  public readonly row = signal<string>('12');
  public readonly bay = signal<string>('05');
  public readonly tier = signal<string>('02');
  public readonly yardStatus = signal<ContainerYardStatus>('In Yard');
  public readonly customerName = signal<string>('');
  public readonly bookingNo = signal<string>('');
  public readonly grossWeightKg = signal<number>(24500);
  public readonly sealNo = signal<string>('');
  public readonly isHazardous = signal<boolean>(false);
  public readonly holds = signal<string>('-');
  public readonly errorMessage = signal<string>('');

  public readonly lines = [
    'MSK',
    'TCLU',
    'OOCL',
    'HMM',
    'TRHU',
    'COSC',
    'CMA',
    'NYK',
    'SUD',
    'PIL',
    'BEA',
    'ZIM',
    'TGHU',
    'UES',
  ];
  public readonly sizeTypes = ["20' GP", "40' GP", "40' HC", "45' HC", "20' OT", "40' Reefer"];
  public readonly blocks = ['A', 'B', 'C', 'D', 'E', 'F'];

  public readonly fullEmptyOptions: DropdownOption[] = [
    { value: 'Full', label: 'Full (Laden)' },
    { value: 'Empty', label: 'Empty' },
  ];

  public readonly yardStatusOptions: DropdownOption[] = [
    { value: 'In Yard', label: 'In Yard' },
    { value: 'Hold', label: 'Hold' },
    { value: 'Ready Out', label: 'Ready Out' },
    { value: 'Overstay', label: 'Overstay' },
  ];

  public readonly blockOptions: DropdownOption[] = ['A', 'B', 'C', 'D', 'E', 'F'].map((b) => ({
    value: b,
    label: `Block ${b}`,
  }));

  public onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }

  public submitForm(): void {
    const cNo = this.containerNo().trim().toUpperCase();
    if (!cNo) {
      this.errorMessage.set('Container Number is required.');
      return;
    }

    this.errorMessage.set('');

    const payload: AddInventoryFormData = {
      containerNo: cNo,
      sizeType: this.sizeType(),
      line: this.line(),
      fullEmpty: this.fullEmpty(),
      block: this.block(),
      row: this.row().padStart(2, '0'),
      bay: this.bay().padStart(2, '0'),
      tier: this.tier().padStart(2, '0'),
      yardStatus: this.yardStatus(),
      customerName: this.customerName().trim() || 'General Client',
      bookingNo: this.bookingNo().trim() || `BKG-${Math.floor(100000 + Math.random() * 900000)}`,
      grossWeightKg: this.grossWeightKg(),
      sealNo: this.sealNo().trim() || `SEAL-${Math.floor(100000 + Math.random() * 900000)}`,
      isHazardous: this.isHazardous(),
      holds: this.holds(),
    };

    this.save.emit(payload);
    this.resetForm();
    this.close.emit();
  }

  public resetForm(): void {
    this.containerNo.set('');
    this.customerName.set('');
    this.bookingNo.set('');
    this.sealNo.set('');
    this.isHazardous.set(false);
    this.holds.set('-');
    this.errorMessage.set('');
  }
}
