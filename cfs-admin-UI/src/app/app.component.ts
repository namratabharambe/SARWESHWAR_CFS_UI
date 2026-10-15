import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from 'core/auth/auth.service';
import { ThemeService } from 'core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  public readonly auth = inject(AuthService);
  public readonly theme = inject(ThemeService);

  public relogin(): void {
    this.auth.handleSessionLogout();
  }
}
