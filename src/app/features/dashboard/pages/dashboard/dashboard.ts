import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';

interface Kpi {
  label: string;
  valor: string;
  variacion: number;   // % vs mes anterior
}

interface Pedido {
  id: string;
  cliente: string;
  producto: string;
  talla: string;
  total: number;
  estado: 'Pendiente' | 'Enviado' | 'Entregado' | 'Cancelado';
  fecha: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  auth = inject(AuthService);
  private router = inject(Router);

  // TODO: todo esto viene del backend (GET /dashboard/resumen)
  kpis: Kpi[] = [
    { label: 'Ventas del mes', valor: '$4.280.000', variacion: 18 },
    { label: 'Pedidos', valor: '47', variacion: 12 },
    { label: 'Visitas a tu tienda', valor: '1.943', variacion: -4 },
    { label: 'Productos activos', valor: '32', variacion: 0 },
  ];

  pedidos: Pedido[] = [
    { id: '#1047', cliente: 'Laura Gómez', producto: 'Camisa Oxford Blanca', talla: 'M', total: 89900, estado: 'Pendiente', fecha: 'Hoy, 10:24' },
    { id: '#1046', cliente: 'Carlos Ruiz', producto: 'Vestido Camisero Lino', talla: 'S', total: 149900, estado: 'Pendiente', fecha: 'Hoy, 8:12' },
    { id: '#1045', cliente: 'Ana Torres', producto: 'Falda Plisada Crema', talla: 'M', total: 99900, estado: 'Enviado', fecha: 'Ayer' },
    { id: '#1044', cliente: 'Julián Pérez', producto: 'Blusa Cuello Halter', talla: 'L', total: 69900, estado: 'Entregado', fecha: '12 jul' },
    { id: '#1043', cliente: 'María Díaz', producto: 'Pantalón Palazzo Beige', talla: 'S', total: 119900, estado: 'Entregado', fecha: '11 jul' },
  ];

  cerrarSesion(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  cop(valor: number): string {
    return '$' + valor.toLocaleString('es-CO');
  }
}