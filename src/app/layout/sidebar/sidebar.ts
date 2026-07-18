import { Component, HostListener, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { UiService } from '../../core/services/ui';
import { AuthService } from '../../core/services/api/auth.service'; // ajusta si tu archivo se llama auth.service

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  ui = inject(UiService);
  auth = inject(AuthService);
  private router = inject(Router);

  cerrar(): void {
    this.ui.cerrarSidebar();
  }

  cerrarSesion(): void {
    this.ui.cerrarSidebar();
    this.auth.logout();
    this.router.navigate(['/']);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.ui.sidebarAbierto()) this.cerrar();
  }
}