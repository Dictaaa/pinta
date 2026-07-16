import { Injectable, signal } from '@angular/core';

/** Estado de UI compartido (sidebar del dashboard, etc.) */
@Injectable({ providedIn: 'root' })
export class UiService {
  readonly sidebarAbierto = signal(false);

  toggleSidebar(): void {
    this.sidebarAbierto.update(v => !v);
  }

  cerrarSidebar(): void {
    this.sidebarAbierto.set(false);
  }
}