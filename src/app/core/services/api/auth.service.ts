import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { ENDPOINTS } from './endpoints';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private api: ApiService) {}

  login(email: string, password: string) {
    return this.api.post(ENDPOINTS.AUTH.LOGIN, {
      email,
      password
    });
  }

  saveSession(token: string, user: any) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  getToken() {
    return localStorage.getItem('token');
  }

  getUser(): any {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }

  getRole(): number {
  return this.getUser()?.role_id ?? 0;
}

  hasRole(roles: number[]): boolean {
    return roles.includes(this.getRole());
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout() {
    localStorage.clear();
  }

}