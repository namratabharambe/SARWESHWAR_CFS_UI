import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'core/auth/auth.service';
import { CenteredDividerComponent } from 'shared/components/atoms/centered-divider/centered-divider.component';
import { FocusInvalidFieldDirective } from 'shared/directives';
import { TranslatePipe } from 'shared/pipes';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CenteredDividerComponent, FocusInvalidFieldDirective, TranslatePipe],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  public readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  public readonly error = signal<string>('');
  public readonly showPassword = signal<boolean>(false);

  public readonly form = new FormGroup({
    userName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(4)],
    }),
    rememberMe: new FormControl(true, { nonNullable: true }),
  });

  public togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  public submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.error.set('');
    const { userName, password } = this.form.getRawValue();

    this.auth.login(userName, password).subscribe({
      next: () => {
        void this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error.set(
          err?.error?.detail ??
            err?.error?.title ??
            err?.error?.message ??
            'Invalid username or password. Please check your credentials.',
        );
      },
    });
  }

  public handleSso(): void {
    this.error.set(
      'Single Sign-On (SSO) is configured for enterprise directory accounts. Please enter your credentials above or contact IT support.',
    );
  }
}
