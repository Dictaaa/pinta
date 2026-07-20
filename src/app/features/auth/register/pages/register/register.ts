// src/app/features/auth/register/pages/register/register.ts
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { AuthService } from '../../../../../core/services/api/auth.service';

interface Ciudad {
  id: number;
  name: string;
  department: string;
}

type EstadoSlug = 'vacio' | 'invalido' | 'verificando' | 'disponible' | 'ocupado';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  enviando = signal(false);
  error = signal<string | null>(null);
  verPassword = signal(false);

  ciudades = signal<Ciudad[]>([]);
  slug = signal('');
  estadoSlug = signal<EstadoSlug>('vacio');

  logoFile = signal<File | null>(null);
  logoPreview = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    first_name: ['', [Validators.required, Validators.minLength(2)]],
    middle_name: [''],
    last_name: ['', [Validators.required, Validators.minLength(2)]],
    second_last_name: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    phone: ['', [Validators.required, Validators.pattern(/^3\d{9}$/)]],
    shop_name: ['', [Validators.required, Validators.minLength(3)]],
    city_id: [null as number | null, Validators.required],
    whatsapp: ['', [Validators.pattern(/^3\d{9}$/)]],
    instagram: [''],
    facebook: [''],
    tiktok: [''],
  });

  constructor() {
    // Ciudades para el select
    this.auth.getCities().subscribe({
      next: (cities: any) => this.ciudades.set(cities),
      error: () => this.error.set('No pudimos cargar las ciudades. Recarga la página.'),
    });

    // Slug en vivo: genera → valida local → consulta al backend (debounced)
    this.form.controls.shop_name.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap(nombre => {
          const slug = this.auth.generarSlug(nombre);
          this.slug.set(slug);

          if (!slug || slug.length < 3) {
            this.estadoSlug.set(slug ? 'invalido' : 'vacio');
            return of(null);
          }
          if (this.auth.esSlugReservado(slug)) {
            this.estadoSlug.set('ocupado');
            return of(null);
          }

          this.estadoSlug.set('verificando');
          return this.auth.slugAvailable(slug);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (res: any) => {
          if (res === null) return;   // ya resuelto localmente
          this.estadoSlug.set(res.available ? 'disponible' : 'ocupado');
        },
        error: () => this.estadoSlug.set('verificando'),
      });
  }

  /* ── Logo ───────────────────────────────────── */
  seleccionarLogo(ev: Event): void {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.error.set('El logo no puede superar 5 MB.');
      return;
    }

    this.logoFile.set(file);
    const reader = new FileReader();
    reader.onload = () => this.logoPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  quitarLogo(): void {
    this.logoFile.set(null);
    this.logoPreview.set(null);
  }

  /* ── Enviar ─────────────────────────────────── */
  enviar(): void {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.estadoSlug() !== 'disponible') {
      this.error.set('La dirección de tu tienda no está disponible.');
      return;
    }

    const raw = this.form.getRawValue();
    const fd = new FormData();
    fd.append('first_name', raw.first_name.trim());
    if (raw.middle_name) fd.append('middle_name', raw.middle_name.trim());
    fd.append('last_name', raw.last_name.trim());
    if (raw.second_last_name) fd.append('second_last_name', raw.second_last_name.trim());
    fd.append('email', raw.email.trim());
    fd.append('password', raw.password);
    fd.append('phone', raw.phone);
    fd.append('shop_name', raw.shop_name.trim());
    fd.append('slug', this.slug());
    fd.append('city_id', String(raw.city_id));
    if (raw.whatsapp) fd.append('whatsapp', raw.whatsapp);
    if (raw.instagram) fd.append('instagram', raw.instagram.trim().replace(/^@/, ''));
    if (raw.facebook) fd.append('facebook', raw.facebook.trim());
    if (raw.tiktok) fd.append('tiktok', raw.tiktok.trim().replace(/^@/, ''));
    if (this.logoFile()) fd.append('logo', this.logoFile()!);

    this.enviando.set(true);

    this.auth.register(fd).subscribe({
      next: (res: any) => {
        this.auth.saveSession(res.token, res.user, res.shop);
        this.router.navigate(['/', res.shop.slug, 'dashboard']);
      },
      error: (err) => {
        this.enviando.set(false);
        this.error.set(err.error?.error ?? 'No pudimos crear tu tienda. Intenta de nuevo.');
      },
    });
  }

  campoInvalido(nombre: string): boolean {
    const c = this.form.get(nombre);
    return !!c && c.invalid && c.touched;
  }
}