import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth';

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

  enviando = signal(false);
  error = signal<string | null>(null);
  verPassword = signal(false);
  slug = signal('');
  slugOcupado = signal(false);

  ciudades = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Otra'];

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    nombreTienda: ['', [Validators.required, Validators.minLength(3)]],
    ciudad: ['', Validators.required],
  });

  constructor() {
    // Generar el slug en vivo mientras escriben el nombre de la tienda
    this.form.controls.nombreTienda.valueChanges.subscribe(nombre => {
      const slug = this.auth.generarSlug(nombre);
      this.slug.set(slug);
      this.slugOcupado.set(slug.length > 0 && !this.auth.slugDisponible(slug));
    });
  }

  async enviar(): Promise<void> {
    if (this.form.invalid || this.slugOcupado() || !this.slug()) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.error.set(null);

    try {
      const datos = this.form.getRawValue();
      await this.auth.registrar({ ...datos, slug: this.slug() });
      this.router.navigate(['/dashboard']);
    } catch {
      this.error.set('No pudimos crear tu tienda. Intenta de nuevo.');
    } finally {
      this.enviando.set(false);
    }
  }

  campoInvalido(nombre: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[nombre];
    return c.invalid && c.touched;
  }
}