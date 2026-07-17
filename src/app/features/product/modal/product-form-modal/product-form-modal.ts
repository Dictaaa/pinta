// src/app/features/dashboard/pages/product-form-modal/product-form-modal.ts
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  ApiProduct, Catalogs, ProductService, VariantInput,
} from '../../../../core/services/product';

/** Lo que el listado le pasa al modal */
export interface ProductFormData {
  producto: ApiProduct | null;   // null = crear
  maxImagenes: number;           // plans.images_per_product
}

interface TallaStock {
  size_id: number;
  name: string;
  selected: boolean;
  stock: number;
}

interface ImagenNueva {
  file: File;
  preview: string;
}

@Component({
  selector: 'app-product-form-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './product-form-modal.html',
  styleUrl: './product-form-modal.scss',
})
export class ProductFormModal {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private dialogRef = inject(MatDialogRef<ProductFormModal>);
  data = inject<ProductFormData>(MAT_DIALOG_DATA);

  esEdicion = computed(() => this.data?.producto != null);
  maxImagenes = signal(this.data?.maxImagenes ?? 10);

  catalogos = signal<Catalogs | null>(null);
  tallas = signal<TallaStock[]>([]);
  imagenesNuevas = signal<ImagenNueva[]>([]);
  imagenesExistentes = signal<{ id: number; url: string }[]>([]);

  enviando = signal(false);
  error = signal<string | null>(null);

  generos = [
    { value: 'woman', label: 'Mujer' },
    { value: 'man', label: 'Hombre' },
    { value: 'girl', label: 'Niña' },
    { value: 'boy', label: 'Niño' },
    { value: 'unisex', label: 'Unisex' },
  ];

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    price: [null as number | null, [Validators.required, Validators.min(1000)]],
    previous_price: [null as number | null],
    category_id: [null as number | null, Validators.required],
    brand_id: [null as number | null],
    gender: ['', Validators.required],
    condition: ['new'],
  });

  constructor() {
    this.productService.getCatalogs().subscribe(cat => {
      this.catalogos.set(cat);
      this.tallas.set(
        cat.sizes.map(s => ({ size_id: s.id, name: s.name, selected: false, stock: 0 })),
      );
      // Precargar DESPUÉS de tener las tallas del catálogo
      if (this.data?.producto) this.precargar(this.data.producto);
    });
  }

  private precargar(p: ApiProduct): void {
    this.form.patchValue({
      name: p.name,
      description: p.description ?? '',
      price: Number(p.price),
      previous_price: p.previous_price ? Number(p.previous_price) : null,
      category_id: p.category_id,
      brand_id: p.brand_id,
      gender: p.gender,
      condition: p.condition,
    });

    this.imagenesExistentes.set(
      (p.images ?? []).map(i => ({ id: i.id, url: i.url })),
    );

    const variantes = p.variants ?? [];
    this.tallas.update(list =>
      list.map(t => {
        const v = variantes.find(x => x.size_id === t.size_id);
        return v ? { ...t, selected: true, stock: v.stock } : t;
      }),
    );
  }

  /* ── Tallas ── */
  toggleTalla(sizeId: number): void {
    this.tallas.update(list =>
      list.map(t => (t.size_id === sizeId ? { ...t, selected: !t.selected } : t)),
    );
  }

  setStock(sizeId: number, ev: Event): void {
    const stock = Math.max(0, Number((ev.target as HTMLInputElement).value) || 0);
    this.tallas.update(list =>
      list.map(t => (t.size_id === sizeId ? { ...t, stock } : t)),
    );
  }

  /* ── Imágenes ── */
  totalImagenes(): number {
    return this.imagenesExistentes().length + this.imagenesNuevas().length;
  }

  seleccionarImagenes(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    const espacio = this.maxImagenes() - this.totalImagenes();

    if (files.length > espacio) {
      this.error.set(`Tu plan permite máximo ${this.maxImagenes()} fotos por producto.`);
    }

    files.slice(0, espacio).forEach(file => {
      const reader = new FileReader();
      reader.onload = () =>
        this.imagenesNuevas.update(list => [
          ...list,
          { file, preview: reader.result as string },
        ]);
      reader.readAsDataURL(file);
    });

    input.value = '';
  }

  quitarNueva(index: number): void {
    this.imagenesNuevas.update(list => list.filter((_, i) => i !== index));
  }

  quitarExistente(imagenId: number): void {
    const producto = this.data?.producto;
    if (!producto) return;
    if (!confirm('¿Eliminar esta foto?')) return;

    this.productService.removeImage(producto.id, imagenId).subscribe({
      next: () =>
        this.imagenesExistentes.update(list => list.filter(i => i.id !== imagenId)),
      error: () => this.error.set('No se pudo eliminar la foto'),
    });
  }

  /* ── Guardar / cerrar ── */
  cancelar(): void {
    this.dialogRef.close(false);
  }

  guardar(): void {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const variantes: VariantInput[] = this.tallas()
      .filter(t => t.selected)
      .map(t => ({ size_id: t.size_id, stock: t.stock }));

    if (variantes.length === 0) {
      this.error.set('Selecciona al menos una talla con stock.');
      return;
    }

    if (!this.esEdicion() && this.imagenesNuevas().length === 0) {
      this.error.set('Sube al menos una foto del producto.');
      return;
    }

    const raw = this.form.getRawValue();
    const data = {
      name: raw.name,
      description: raw.description,
      price: raw.price!,
      previous_price: raw.previous_price,
      category_id: raw.category_id!,
      brand_id: raw.brand_id,
      gender: raw.gender,
      condition: raw.condition,
      variants: variantes,
    };

    this.enviando.set(true);

    const peticion = this.esEdicion()
      ? this.productService.update(this.data.producto!.id, data)
      : this.productService.create(data, this.imagenesNuevas().map(i => i.file));

    peticion.subscribe({
      next: producto => {
        const nuevas = this.imagenesNuevas().map(i => i.file);
        if (this.esEdicion() && nuevas.length > 0) {
          this.productService.addImages(producto.id, nuevas).subscribe({
            next: () => this.dialogRef.close(true),
            error: err => {
              this.enviando.set(false);
              this.error.set(err.error?.error ?? 'El producto se guardó pero las fotos fallaron');
            },
          });
        } else {
          this.dialogRef.close(true);   // true = el listado recarga
        }
      },
      error: err => {
        this.enviando.set(false);
        this.error.set(err.error?.error ?? 'No se pudo guardar el producto');
      },
    });
  }

  campoInvalido(nombre: string): boolean {
    const c = this.form.get(nombre);
    return !!c && c.invalid && c.touched;
  }
}