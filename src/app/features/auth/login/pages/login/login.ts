import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../../core/services/api/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  enviando = signal(false);
  error = signal<string | null>(null);
  verPassword = signal(false);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.error.set(null);

    const { email, password } = this.form.getRawValue();

    this.auth.login(email, password).subscribe({
      next: (res: any) => {
        this.auth.saveSession(res.token, res.user, res.shop);
        this.router.navigate(['/', res.shop.slug, 'dashboard']);
      },
      error: (err) => {
        this.enviando.set(false);
        this.error.set(err.error?.error ?? 'Correo o contraseña incorrectos.');
      },
    });
  }

  campoInvalido(nombre: 'email' | 'password'): boolean {
    const c = this.form.controls[nombre];
    return c.invalid && c.touched;
  }
}