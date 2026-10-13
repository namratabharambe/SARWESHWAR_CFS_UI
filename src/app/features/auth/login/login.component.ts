import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'core/auth/auth.service';
import { FocusInvalidFieldDirective } from 'shared/directives';

import { ThemeService } from 'core/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, FocusInvalidFieldDirective],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  public readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly theme = inject(ThemeService);

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

  public readonly isAuthenticating = signal<boolean>(false);
  public readonly splashStep = signal<string>('AUTHENTICATING TERMINAL CREDENTIALS...');

  constructor() {
    this.form.valueChanges.subscribe(() => {
      if (this.error()) {
        this.error.set('');
      }
    });
  }

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
        // By default, activate light mode on login
        this.theme.setDarkMode(false);
        this.isAuthenticating.set(true);
        this.splashStep.set('AUTHENTICATING TERMINAL CREDENTIALS...');

        setTimeout(() => {
          this.splashStep.set('CONNECTING TO CFS CONTROL TOWER...');
        }, 700);

        setTimeout(() => {
          this.splashStep.set('SYNCING GATE OCR & YARD TELEMETRY...');
        }, 1400);

        setTimeout(() => {
          this.splashStep.set('WELCOME TO PROSPER CFS !');
        }, 2100);

        setTimeout(() => {
          void this.router.navigate(['/dashboard']);
        }, 2600);
      },
      error: (err) => {
        let message = 'Invalid email address or password. Please verify your credentials and try again.';
        if (err?.status === 0 || err?.status === 504) {
          message = 'Unable to connect to the CFS authentication server. Please check your network connection.';
        } else if (err?.status === 401 || err?.status === 403) {
          message = 'Invalid email address or password. Please verify your credentials and try again.';
        } else if (typeof err?.error === 'string' && err.error.trim().length > 0 && !err.error.includes('<html') && !err.error.includes('{')) {
          message = err.error.trim();
        } else if (err?.error?.detail && typeof err.error.detail === 'string') {
          message = err.error.detail.trim();
        } else if (err?.error?.message && typeof err.error.message === 'string') {
          message = err.error.message.trim();
        } else if (err?.error?.title && typeof err.error.title === 'string' && !err.error.title.includes('One or more')) {
          message = err.error.title.trim();
        }
        this.error.set(message);
      },
    });
  }

  public handleSso(): void {
    this.error.set(
      'Single Sign-On (SSO) is configured for enterprise directory accounts. Please enter your credentials above or contact IT support.',
    );
  }
}
