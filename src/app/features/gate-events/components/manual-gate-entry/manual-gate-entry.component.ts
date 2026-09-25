import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePickerComponent } from 'shared/components/molecules/date-picker/date-picker.component';
import { DropdownComponent, DropdownOption } from 'shared/components/molecules/dropdown/dropdown.component';
import { TranslatePipe } from 'shared/pipes';

export interface GateInTableItem {
  id: string;
  action?: string;
  scanStatus: string;
  doorToDoor: boolean;
  isoCode: string;
  portName: string;
  weight: string;
  remarks: string;
  scanType: string;
  scanDateTime: string;
  cargoType: string;
  unNo: string;
  itemClass: string;
  containerNo?: string;
}

export interface GateInFormData {
  containerNo: string;
  isoCode: string;
  size: string;
  tareWeight: string;
  type: string;
  cargoType: string;
  joType: string;
  fclLcl: string;
  scanType: string;
  offloadLocation: string;
  vesselName: string;
  portName: string;
  shippingLine: string;
  igmSeal: string;
  sealNo1: string;
  sealNo2: string;
  customSealNo: string;
  customerName: string;
  eirNo: string;
  eirWeight: string;
  eirDateTime: string;
  location: string;
  condition: string;
  remarks: string;
  doorToDoor: boolean;
}

@Component({
  selector: 'app-manual-gate-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePickerComponent, DropdownComponent, TranslatePipe],
  templateUrl: './manual-gate-entry.component.html',
  styleUrls: ['./manual-gate-entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualGateEntryComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly close = output<void>();
  public readonly save = output<GateInFormData[]>();

  // Live or mock formatted date/time for header
  public readonly currentFormattedDate = signal<string>('Thu, 22 May 2025 12:35 PM');

  // Form Signals
  public readonly containerNo = signal<string>('');
  public readonly isoCode = signal<string>('');
  public readonly size = signal<string>('');
  public readonly tareWeight = signal<string>('');
  public readonly type = signal<string>('');
  public readonly cargoType = signal<string>('');
  public readonly joType = signal<string>('Air Import');
  public readonly fclLcl = signal<string>('');
  public readonly scanType = signal<string>('');

  public readonly offloadLocation = signal<string>('');
  public readonly vesselName = signal<string>('');
  public readonly portName = signal<string>('BMCT');
  public readonly shippingLine = signal<string>('');
  public readonly igmSeal = signal<string>('');

  public readonly sealNo1 = signal<string>('');
  public readonly sealNo2 = signal<string>('');
  public readonly customSealNo = signal<string>('');
  public readonly customerName = signal<string>('');

  public readonly eirNo = signal<string>('');
  public readonly eirWeight = signal<string>('');
  public readonly eirDateTime = signal<string>('');
  public readonly location = signal<string>('A SHEL');
  public readonly condition = signal<string>('');

  public readonly remarks = signal<string>('');
  public readonly doorToDoor = signal<boolean>(false);

  // Attachment state
  public readonly attachedFileName = signal<string>('');

  // Dropdown Options
  public readonly isoCodeOptions: DropdownOption[] = [
    { value: '22G1', label: '22G1' },
    { value: '42G1', label: '42G1' },
    { value: '45G1', label: '45G1' },
    { value: '20GP', label: '20GP' },
    { value: '40HC', label: '40HC' },
    { value: '45HC', label: '45HC' },
    { value: '22U1', label: '22U1' },
  ];

  public readonly sizeOptions: DropdownOption[] = [
    { value: '20', label: '20 FT' },
    { value: '40', label: '40 FT' },
    { value: '45', label: '45 FT' },
  ];

  public readonly typeOptions: DropdownOption[] = [
    { value: 'Dry', label: 'Dry' },
    { value: 'Reefer', label: 'Reefer' },
    { value: 'Flat Rack', label: 'Flat Rack' },
    { value: 'Open Top', label: 'Open Top' },
    { value: 'Tank', label: 'Tank' },
  ];

  public readonly cargoTypeOptions: DropdownOption[] = [
    { value: 'General', label: 'General Cargo' },
    { value: 'Hazardous', label: 'Hazardous' },
    { value: 'Perishable', label: 'Perishable' },
    { value: 'Refrigerated', label: 'Refrigerated' },
  ];

  public readonly joTypeOptions: DropdownOption[] = [
    { value: 'Air Import', label: 'Air Import' },
    { value: 'Sea Import', label: 'Sea Import' },
    { value: 'Direct Gate In', label: 'Direct Gate In' },
    { value: 'CFS Bonded', label: 'CFS Bonded' },
  ];

  public readonly fclLclOptions: DropdownOption[] = [
    { value: 'FCL', label: 'FCL' },
    { value: 'LCL', label: 'LCL' },
  ];

  public readonly scanTypeOptions: DropdownOption[] = [
    { value: 'Normal Scan', label: 'Normal Scan' },
    { value: 'X-Ray Scan', label: 'X-Ray Scan' },
    { value: 'Physical', label: 'Physical Inspection' },
    { value: 'Gamma', label: 'Gamma Ray' },
  ];

  public readonly portNameOptions: DropdownOption[] = [
    { value: 'BMCT', label: 'BMCT' },
    { value: 'JNPT', label: 'JNPT' },
    { value: 'NSICT', label: 'NSICT' },
    { value: 'NSIGT', label: 'NSIGT' },
    { value: 'GTI', label: 'GTI' },
  ];

  public readonly locationOptions: DropdownOption[] = [
    { value: 'A SHEL', label: 'A SHEL' },
    { value: 'B YARD', label: 'B YARD' },
    { value: 'C STACK', label: 'C STACK' },
    { value: 'D DOCK', label: 'D DOCK' },
  ];

  public readonly conditionOptions: DropdownOption[] = [
    { value: 'Sound', label: 'Sound' },
    { value: 'Damaged', label: 'Damaged' },
    { value: 'Pending Inspection', label: 'Pending Inspection' },
  ];

  // Validation feedback
  public readonly errorMessage = signal<string>('');

  // Table items signal
  public readonly tableItems = signal<GateInTableItem[]>([]);

  // Computed count
  public readonly totalItems = computed<number>(() => this.tableItems().length);

  public onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }

  public addItemToTable(): void {
    const cNo = this.containerNo().trim().toUpperCase();
    if (!cNo) {
      this.errorMessage.set('Container No is required to add an entry.');
      return;
    }
    if (!this.isoCode()) {
      this.errorMessage.set('ISO Code is required.');
      return;
    }

    this.errorMessage.set('');

    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newItem: GateInTableItem = {
      id: 'item-' + Date.now(),
      action: 'delete',
      scanStatus: 'Pending',
      doorToDoor: this.doorToDoor(),
      isoCode: this.isoCode() || '42G1',
      portName: this.portName() || 'BMCT',
      weight: this.eirWeight() ? `${this.eirWeight()} KG` : this.tareWeight() ? `${this.tareWeight()} KG` : '28,450 KG',
      remarks: this.remarks() || 'Standard entry scan',
      scanType: this.scanType() || 'Normal Scan',
      scanDateTime: this.eirDateTime() || formattedDate,
      cargoType: this.cargoType() || 'General Cargo',
      unNo: '-',
      itemClass: '-',
      containerNo: cNo,
    };

    this.tableItems.update((items) => [newItem, ...items]);

    // Reset container-specific fields for the next entry while preserving header/shipment fields
    this.containerNo.set('');
    this.sealNo1.set('');
    this.sealNo2.set('');
    this.customSealNo.set('');
    this.eirNo.set('');
    this.eirWeight.set('');
    this.remarks.set('');
  }

  public removeTableItem(id: string): void {
    this.tableItems.update((items) => items.filter((item) => item.id !== id));
  }

  public handleAttachment(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.attachedFileName.set(input.files[0].name);
    }
  }

  public resetForm(): void {
    this.containerNo.set('');
    this.isoCode.set('');
    this.size.set('');
    this.tareWeight.set('');
    this.type.set('');
    this.cargoType.set('');
    this.joType.set('Air Import');
    this.fclLcl.set('');
    this.scanType.set('');
    this.offloadLocation.set('');
    this.vesselName.set('');
    this.portName.set('BMCT');
    this.shippingLine.set('');
    this.igmSeal.set('');
    this.sealNo1.set('');
    this.sealNo2.set('');
    this.customSealNo.set('');
    this.customerName.set('');
    this.eirNo.set('');
    this.eirWeight.set('');
    this.eirDateTime.set('');
    this.location.set('A SHEL');
    this.condition.set('');
    this.remarks.set('');
    this.doorToDoor.set(false);
    this.attachedFileName.set('');
    this.errorMessage.set('');
    this.tableItems.set([]);
  }

  public submitForm(): void {
    if (this.tableItems().length === 0) {
      if (!this.containerNo().trim()) {
        this.errorMessage.set('Please enter a Container No or add items to the table before saving.');
        return;
      }
      this.addItemToTable();
    }

    const currentForm: GateInFormData = {
      containerNo: this.containerNo(),
      isoCode: this.isoCode(),
      size: this.size(),
      tareWeight: this.tareWeight(),
      type: this.type(),
      cargoType: this.cargoType(),
      joType: this.joType(),
      fclLcl: this.fclLcl(),
      scanType: this.scanType(),
      offloadLocation: this.offloadLocation(),
      vesselName: this.vesselName(),
      portName: this.portName(),
      shippingLine: this.shippingLine(),
      igmSeal: this.igmSeal(),
      sealNo1: this.sealNo1(),
      sealNo2: this.sealNo2(),
      customSealNo: this.customSealNo(),
      customerName: this.customerName(),
      eirNo: this.eirNo(),
      eirWeight: this.eirWeight(),
      eirDateTime: this.eirDateTime(),
      location: this.location(),
      condition: this.condition(),
      remarks: this.remarks(),
      doorToDoor: this.doorToDoor(),
    };

    this.save.emit([currentForm]);
    this.resetForm();
    this.close.emit();
  }
}

/** Backwards-compatible export alias */
export { ManualGateEntryComponent as GateInModalComponent };
