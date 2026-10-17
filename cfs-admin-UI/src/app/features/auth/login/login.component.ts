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

  // Forgot password modal state
  public readonly showForgotPassword = signal<boolean>(false);
  public readonly forgotEmailOrUser = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(3)],
  });
  public readonly forgotStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  public readonly forgotMessage = signal<string>('');

  constructor() {
    this.form.valueChanges.subscribe(() => {
      if (this.error()) {
        this.error.set('');
      }
    });
  }

  public openForgotPassword(): void {
    this.showForgotPassword.set(true);
    this.forgotStatus.set('idle');
    this.forgotMessage.set('');
    this.forgotEmailOrUser.reset();
  }

  public closeForgotPassword(): void {
    this.showForgotPassword.set(false);
  }

  public submitForgotPassword(): void {
    if (this.forgotEmailOrUser.invalid) {
      this.forgotEmailOrUser.markAsTouched();
      return;
    }
    const val = this.forgotEmailOrUser.value.trim();
    this.forgotStatus.set('loading');
    this.forgotMessage.set('');

    this.auth.forgotPassword(val).subscribe({
      next: () => {
        this.forgotStatus.set('success');
        this.forgotMessage.set('Password reset instructions have been sent to your registered email address.');
      },
      error: (err) => {
        // Even on some backends, 204 or user not found is handled
        if (err?.status === 200 || err?.status === 204) {
          this.forgotStatus.set('success');
          this.forgotMessage.set('Password reset instructions have been sent to your registered email address.');
        } else {
          this.forgotStatus.set('error');
          this.forgotMessage.set(
            err?.error?.message ||
              err?.error?.detail ||
              'Unable to process password reset request. Please check your username/email and try again.',
          );
        }
      },
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
        } else if (err?.status === 429) {
          message = 'Too many login attempts. Please wait a moment and try again.';
        } else if (err?.status === 503) {
          message = 'The authentication service is temporarily unavailable. Please wait a few seconds and try again.';
        } else if (err?.status === 423) {
          message = err?.error?.detail || 'Your account is temporarily locked due to multiple failed login attempts. Please wait 15 minutes or contact your administrator.';
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
