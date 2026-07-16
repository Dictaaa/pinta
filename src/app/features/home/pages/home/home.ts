import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  pasos = [
    {
      numero: '01',
      titulo: 'Encuentra tu tienda',
      texto: 'Cada tienda tiene su propia página con dirección propia. Entra directo o descúbrelas en el marketplace.',
    },
    {
      numero: '02',
      titulo: 'Compra con confianza',
      texto: 'Pago protegido por PINTA: el dinero se libera a la tienda cuando recibes tu pedido.',
    },
    {
      numero: '03',
      titulo: 'Recibe en todo el país',
      texto: 'Envíos a toda Colombia desde la ciudad de cada tienda, con seguimiento de tu pedido.',
    },
  ];

  beneficiosTienda = [
    'Tu propia URL: pinta.co/TuTienda',
    'Catálogo, pedidos y pagos en un solo lugar',
    'Sin mensualidades: solo comisión por venta',
    'Llega a compradores de toda Colombia',
  ];
}