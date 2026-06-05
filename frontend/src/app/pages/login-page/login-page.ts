import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-login-page',
  imports: [FormsModule, CommonModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  username = '';
  password = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) { }

  fillCredentials(user: string, pass: string) {
    this.username = user;
    this.password = pass;
    this.error = '';
  }

  login() {
    this.auth.login(this.username, this.password).subscribe({
      next: (res) => {
        this.auth.setAuth(res.token, res.role);
        this.router.navigate(['/assignments']);
      },
      error: () => {
        this.error = 'Invalid credentials';
      }
    });
  }
}
