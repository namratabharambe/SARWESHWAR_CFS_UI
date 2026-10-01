import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'core/auth/auth.service';
import { CenteredDividerComponent } from 'shared/components/atoms/centered-divider/centered-divider.component';
import { FocusInvalidFieldDirective } from 'shared/directives';
import { TranslatePipe } from 'shared/pipes';

import { ThemeService } from 'core/services/theme.service';

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
  public readonly splashStep = signal<string>('Authenticating credentials...');

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
        this.splashStep.set('Authenticating terminal credentials...');

        setTimeout(() => {
          this.splashStep.set('Connecting to CFS Control Tower...');
        }, 700);

        setTimeout(() => {
          this.splashStep.set('Syncing Gate OCR & Yard Telemetry...');
        }, 1400);

        setTimeout(() => {
          this.splashStep.set('Welcome to PROSPER CFS!');
        }, 2100);

        setTimeout(() => {
          void this.router.navigate(['/dashboard']);
        }, 2500);
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
