import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DropdownComponent } from '../dropdown/dropdown.component';

export interface SelectOption {
  label: string;
  value: string;
}

export type FieldType = 'text' | 'email' | 'password' | 'select' | 'multiselect' | 'textarea';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [ReactiveFormsModule, DropdownComponent],
  templateUrl: './form-field.component.html',
  styleUrls: ['./form-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldComponent {
  public readonly label = input.required<string>();
  public readonly control = input.required<FormControl<any>>();
  public readonly name = input<string>('');
  public readonly type = input<FieldType>('text');
  public readonly placeholder = input<string>('');
  public readonly autocomplete = input<string>('off');
  public readonly hint = input<string>('');
  public readonly icon = input<string>('');
  public readonly options = input<SelectOption[]>([]);
  public readonly fieldId = input<string>(`field-${Math.random().toString(36).substring(2, 9)}`);

  public readonly controlNameAttr = computed<string>(() => this.name() || this.fieldId());

  public readonly errorMessage = computed<string>(() => {
    const c = this.control();
    if (!c.touched || !c.errors) return '';
    if (c.hasError('required')) return `${this.label()} is required.`;
    if (c.hasError('email')) return 'Enter a valid email address.';
    if (c.hasError('minlength')) {
      return `${this.label()} must be at least ${c.errors['minlength'].requiredLength} characters.`;
    }
    return `Please check ${this.label().toLowerCase()}.`;
  });
}
