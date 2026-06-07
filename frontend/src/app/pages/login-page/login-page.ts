import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ConfigService } from '../../services/config.service';
import { environment } from '../../../environments/environment';
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
  showUrlField = false;
  tempUrl = '';

  constructor(private auth: AuthService, private router: Router, private configService: ConfigService, private cdr: ChangeDetectorRef) { }

  fillCredentials(user: string, pass: string) {
    this.username = user;
    this.password = pass;
    this.error = '';
  }

  login() {
    this.auth.login(this.username, this.password).subscribe({
      next: (res: { token: string; role: string; }) => {
        this.auth.setAuth(res.token, res.role);
        this.auth.checkHealth().subscribe({
        next: (health:{ db: boolean }) => {
            if (health.db) {
              this.router.navigate(['/assignments']);
            } else {
              this.router.navigate(['/settings']);
            }
          },  
          error: () => this.router.navigate(['/settings'])
        });
      },  
      error: (err) => {
        if (err.status === 0 || err.status === 404) {
          if (environment.isOnline) {
            this.error = 'Backend is starting up. Please wait a moment and try again.';
          }
          else {
            this.error = 'Cannot reach backend.';
            this.showUrlField = true;
          }
        }
        else if (err.status === 401) {
          this.error = 'Invalid credentials';
          this.showUrlField = false;
        }
        else
        {
          this.error = `Unknown error ${err.status}`;
          console.warn(this.error);
        }
        this.cdr.detectChanges();
      }
    });
  }

  applyTempUrl() {
    if (this.tempUrl) {
      this.configService.setApiUrl(this.tempUrl);
      this.error = 'URL updated.';
      this.showUrlField = false;
      this.cdr.detectChanges();
    }
  }

  get currentUrl(): string {
    return this.configService.apiUrl;
  }
}
