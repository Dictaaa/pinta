import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { StoreContextService } from '../../../../core/services/store-context';

/* ────────────────────────────────────────────────
   Modelos — mover a src/app/core/models cuando
   se conecte el backend real
──────────────────────────────────────────────── */
export interface StoreProduct {
  id: number;
  nombre: string;
  precio: number;
  anterior?: number;
  badge?: 'Nuevo' | 'Oferta' | 'Más vendido';
  rating: number;
  ventas: number;
  categoria: string;
  imagen?: string;   // URL real cuando exista backend
  tono: string;      // color de fondo del placeholder
}

export interface StoreProfile {
  slug: string;
  nombre: string;
  ciudad: string;
  descripcion: string;
  rating: number;
  ventas: number;
  seguidores: number;
  verificada: boolean;
}

type Orden = 'relevancia' | 'ventas' | 'precio_asc' | 'precio_desc' | 'rating';

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [],
  templateUrl: './store.html',
  styleUrl: './store.scss',
})
export class Store {
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  /* ── Estado ─────────────────────────────────── */
  tienda = signal<StoreProfile | null>(null);
  productos = signal<StoreProduct[]>([]);
  cargando = signal(true);
  noEncontrada = signal(false);

  categoriaActiva = signal<string>('Todo');
  orden = signal<Orden>('relevancia');
  siguiendo = signal(false);
  favoritos = signal<Set<number>>(new Set());

  /* ── Derivados ──────────────────────────────── */
  categorias = computed(() => {
    const unicas = [...new Set(this.productos().map(p => p.categoria))];
    return ['Todo', ...unicas];
  });

  productosFiltrados = computed(() => {
    const cat = this.categoriaActiva();
    let lista = this.productos()
      .filter(p => cat === 'Todo' || p.categoria === cat);

    switch (this.orden()) {
      case 'ventas':      lista = [...lista].sort((a, b) => b.ventas - a.ventas); break;
      case 'precio_asc':  lista = [...lista].sort((a, b) => a.precio - b.precio); break;
      case 'precio_desc': lista = [...lista].sort((a, b) => b.precio - a.precio); break;
      case 'rating':      lista = [...lista].sort((a, b) => b.rating - a.rating); break;
    }
    return lista;
  });

  private storeCtx = inject(StoreContextService);

constructor() {
  this.route.paramMap
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(params => this.cargarTienda(params.get('slug') ?? ''));

  this.destroyRef.onDestroy(() => this.storeCtx.clear());
}

  /* ── Carga (mock — reemplazar por StoreService) ─ */
  private cargarTienda(slug: string): void {
    this.cargando.set(true);
    this.noEncontrada.set(false);
    this.categoriaActiva.set('Todo');

    // TODO: this.storeService.getBySlug(slug) cuando exista el API
    const data = MOCK_TIENDAS[slug.toLowerCase()];

    if (!data) {
      this.tienda.set(null);
      this.productos.set([]);
      this.noEncontrada.set(true);
      this.cargando.set(false);
      return;
    }

    this.tienda.set(data.perfil);
this.storeCtx.set(data.perfil);   // ← esto pinta el nombre en la topnav
    this.productos.set(data.productos);
    this.cargando.set(false);
  }

  /* ── Acciones ───────────────────────────────── */
  toggleFavorito(id: number, ev: Event): void {
    ev.preventDefault();
    ev.stopPropagation();
    const set = new Set(this.favoritos());
    set.has(id) ? set.delete(id) : set.add(id);
    this.favoritos.set(set);
  }

  toggleSeguir(): void {
    this.siguiendo.update(v => !v);
  }

  cambiarOrden(ev: Event): void {
    this.orden.set((ev.target as HTMLSelectElement).value as Orden);
  }

  /* ── Helpers de presentación ────────────────── */
  cop(valor: number): string {
    return '$' + valor.toLocaleString('es-CO');
  }

  iniciales(nombre: string): string {
    return nombre
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  compacto(n: number): string {
    return n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + ' mil' : String(n);
  }
}

/* ────────────────────────────────────────────────
   Mock data — eliminar al conectar el backend
──────────────────────────────────────────────── */
export const MOCK_TIENDAS: Record<string, { perfil: StoreProfile; productos: StoreProduct[] }> = {
  modaluna: {
    perfil: {
      slug: 'ModaLuna',
      nombre: 'ModaLuna',
      ciudad: 'Bogotá',
      descripcion:
        'Prendas atemporales hechas en Colombia. Producción en tallas pequeñas, telas naturales y envíos a todo el país.',
      rating: 4.8,
      ventas: 2340,
      seguidores: 12800,
      verificada: true,
    },
    productos: [
  { id: 1, nombre: 'Camisa Oxford Blanca', precio: 89900, badge: 'Más vendido', rating: 4.8, ventas: 124, categoria: 'Camisas', tono: '#F4F3F1',
    imagen: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80&auto=format&fit=crop' },
  { id: 2, nombre: 'Falda Plisada Crema', precio: 99900, rating: 4.5, ventas: 47, categoria: 'Faldas', tono: '#F3F1EC',
    imagen: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&q=80&auto=format&fit=crop' },
  { id: 3, nombre: 'Vestido Camisero Lino', precio: 149900, anterior: 189900, badge: 'Oferta', rating: 4.9, ventas: 86, categoria: 'Vestidos', tono: '#EFEDE8',
    imagen: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80&auto=format&fit=crop' },
  { id: 4, nombre: 'Blusa Cuello Halter', precio: 69900, badge: 'Nuevo', rating: 4.6, ventas: 31, categoria: 'Camisas', tono: '#F2F0EC',
    imagen: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600&q=80&auto=format&fit=crop' },
  { id: 5, nombre: 'Pantalón Palazzo Beige', precio: 119900, rating: 4.7, ventas: 92, categoria: 'Pantalones', tono: '#F1EFEA',
    imagen: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&q=80&auto=format&fit=crop' },
  { id: 6, nombre: 'Vestido Midi Negro', precio: 139900, rating: 4.8, ventas: 158, categoria: 'Vestidos', tono: '#F4F4F3',
    imagen: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&q=80&auto=format&fit=crop' },
  { id: 7, nombre: 'Falda Denim Recta', precio: 89900, anterior: 109900, badge: 'Oferta', rating: 4.4, ventas: 63, categoria: 'Faldas', tono: '#EDEFF2',
    imagen: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80&auto=format&fit=crop' },
  { id: 8, nombre: 'Camisa Rayas Oversize', precio: 94900, badge: 'Nuevo', rating: 4.7, ventas: 22, categoria: 'Camisas', tono: '#F0F1F2',
    imagen: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80&auto=format&fit=crop' },
],
  },
  casaaurora: {
    perfil: {
      slug: 'CasaAurora',
      nombre: 'Casa Aurora',
      ciudad: 'Medellín',
      descripcion: 'Básicos elevados y tejidos suaves. Diseñado y confeccionado en Medellín.',
      rating: 4.9,
      ventas: 1870,
      seguidores: 9400,
      verificada: true,
    },
    productos: [
      { id: 10, nombre: 'Vestido Midi de Lino', precio: 159900, anterior: 219900, badge: 'Oferta', rating: 4.9, ventas: 86, categoria: 'Vestidos', tono: '#EFEDE8' },
      { id: 11, nombre: 'Body Canalé Negro', precio: 59900, badge: 'Más vendido', rating: 4.6, ventas: 112, categoria: 'Bodys', tono: '#F4F4F3' },
      { id: 12, nombre: 'Camiseta Boxy Fit', precio: 54900, rating: 4.8, ventas: 210, categoria: 'Camisetas', tono: '#F5F4F2' },
      { id: 13, nombre: 'Vestido Slip Satén', precio: 129900, badge: 'Nuevo', rating: 4.7, ventas: 18, categoria: 'Vestidos', tono: '#F2F0ED' },
    ],
  },
};