import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from 'core/auth/auth.service';

export interface RoleLogic {
  any?: string[];
  all?: string[];
  not?: string[];
}

@Directive({
  selector: '[appUserRolesAccess]',
  standalone: true,
})
export class UserRolesAccessDirective {
  public readonly appUserRolesAccess = input<RoleLogic | string[] | string>([]);

  private readonly authService = inject(AuthService);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);

  constructor() {
    effect(() => {
      this.updateView();
    });
  }

  private updateView(): void {
    const isAuthorized = this.checkAccess();
    this.viewContainer.clear();

    if (isAuthorized) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }

  private checkAccess(): boolean {
    const rolesConfig = this.appUserRolesAccess();
    if (!rolesConfig) return false;

    if (typeof rolesConfig === 'string' || Array.isArray(rolesConfig)) {
      return this.authService.hasRole(rolesConfig);
    }

    // Evaluate RoleLogic object
    if (rolesConfig.not?.length) {
      if (this.authService.hasRole(rolesConfig.not)) {
        return false;
      }
    }

    if (rolesConfig.all?.length) {
      const hasAll = rolesConfig.all.every((r) => this.authService.hasRole(r));
      if (!hasAll) {
        return false;
      }
    }

    if (rolesConfig.any?.length) {
      return this.authService.hasRole(rolesConfig.any);
    }

    return true;
  }
}
