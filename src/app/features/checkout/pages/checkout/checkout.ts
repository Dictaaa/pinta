// src/app/features/checkout/pages/checkout/checkout.ts
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartItem, CartService } from '../../../../core/services/cart';
import { AuthService } from '../../../../core/services/api/auth.service';
import {
  CheckoutService, CheckoutResponse,
} from '../../../../core/services/api/checkout.service';

interface Ciudad {
  id: number;
  name: string;
  department: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private fb = inject(FormBuilder);
  cart = inject(CartService);
  private checkoutService = inject(CheckoutService);
  private auth = inject(AuthService);

  ciudades = signal<Ciudad[]>([]);
  enviando = signal(false);
  error = signal<string | null>(null);
  resultado = signal<CheckoutResponse | null>(null);
  mismoReceptor = signal(true);

  /** Items agrupados por tienda — mismo patrón que la página de carrito */
  grupos = computed(() => {
    const mapa = new Map<string, { nombre: string; items: CartItem[]; subtotal: number }>();
    for (const item of this.cart.items()) {
      let g = mapa.get(item.tiendaSlug);
      if (!g) {
        g = { nombre: item.tiendaNombre, items: [], subtotal: 0 };
        mapa.set(item.tiendaSlug, g);
      }
      g.items.push(item);
      g.subtotal += item.precio * item.cantidad;
    }
    return [...mapa.values()];
  });

  envioTotal = computed(() => this.grupos().length * 12000);
  totalGeneral = computed(() => this.cart.total() + this.envioTotal());

  form = this.fb.nonNullable.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^3\d{9}$/)]],
    city_id: [null as number | null, Validators.required],
    address_line: ['', Validators.required],
    address_detail: [''],
    receiver_name: ['', Validators.required],
    receiver_phone: ['', [Validators.required, Validators.pattern(/^3\d{9}$/)]],
  });

  constructor() {
    this.auth.getCities().subscribe({
      next: (cities: any) => this.ciudades.set(cities),
      error: () => this.error.set('No pudimos cargar las ciudades.'),
    });

    // Autocompletar receptor = comprador mientras el checkbox esté activo
    this.form.valueChanges.subscribe(v => {
      if (this.mismoReceptor()) {
        this.form.patchValue(
          {
            receiver_name: `${v.first_name ?? ''} ${v.last_name ?? ''}`.trim(),
            receiver_phone: v.phone ?? '',
          },
          { emitEvent: false },
        );
      }
    });
  }

  toggleMismoReceptor(): void {
    this.mismoReceptor.update(v => !v);
  }

  campoInvalido(nombre: string): boolean {
    const c = this.form.get(nombre);
    return !!c && c.invalid && c.touched;
  }

  confirmar(): void {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.cart.items().length === 0) {
      this.error.set('Tu carrito está vacío.');
      return;
    }

    const raw = this.form.getRawValue();
    this.enviando.set(true);

    this.checkoutService.submit({
      buyer: {
        first_name: raw.first_name,
        last_name: raw.last_name,
        email: raw.email,
        phone: raw.phone,
      },
      shipping: {
        city_id: raw.city_id!,
        address_line: raw.address_line,
        address_detail: raw.address_detail || undefined,
        receiver_name: raw.receiver_name,
        receiver_phone: raw.receiver_phone,
      },
      items: this.cart.items().map(i => ({
        product_id: i.productoId,
        variant_id: i.variantId ?? null,
        quantity: i.cantidad,
      })),
    }).subscribe({
      next: res => {
        this.resultado.set(res);
        this.cart.vaciar();
        this.enviando.set(false);
      },
      error: err => {
        this.enviando.set(false);
        this.error.set(err.error?.error ?? 'No pudimos procesar tu pedido.');
      },
    });
  }

  cop(valor: number): string {
    return '$' + valor.toLocaleString('es-CO');
  }

  whatsappLink(numero: string | null): string {
    return numero ? `https://wa.me/57${numero}` : '#';
  }
}