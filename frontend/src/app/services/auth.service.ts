import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export  class AuthService {
  private token: string | null = null;
  private role: string | null = null;

  constructor(private http: HttpClient, private router: Router) { }

  login(username: string, password: string) {
    return this.http.post<{ token: string; role: string }>(
      `${environment.apiUrl}/api/auth/login`,
      { username, password }
    );
  }

  setAuth(token: string, role: string) {
    this.token = token;
    this.role = role;
  }

  getToken() { return this.token; }
  getRole() { return this.role; }
  isLoggedIn() { return !!this.token; }
  isAdmin() { return this.role === 'admin'; }
  isReadonly() { return this.role === 'readonly'; }

  logout() {
    this.token = null;
    this.role = null;
    this.router.navigate(['/login']);
  }
}
