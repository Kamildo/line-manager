import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ConfigService } from '../../services/config.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPage implements OnInit {
  isOnline = environment.isOnline;
  role = '';

  // URL management
  currentApiUrl = '';
  newApiUrl = '';
  urlStatus = '';
  urlTestPassed = false;
  urlSaved = false;
  hasCustomUrl = false;

  // Connection check
  connectionStatus: boolean | null = null;
  errorMsg = '';

  // Reset DB
  resetStatus = '';
  resetError = false;

  loading = false;

  get backendUrl(): string {
    return this.configService.apiUrl;
  }

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private configService: ConfigService
  ) { }

  ngOnInit(): void {
    this.role = this.auth.getRole() ?? '';
    this.currentApiUrl = this.configService.apiUrl;
    this.hasCustomUrl = !!localStorage.getItem('apiUrl');
    this.newApiUrl = this.currentApiUrl;

    // Auto health check on load
    if (!this.isOnline && (this.role === 'user' || this.role === 'admin')) {
      this.checkConnection();
    }
  }

  testUrl(): void {
    if (!this.newApiUrl) return;
    this.loading = true;
    this.urlStatus = '';
    this.urlTestPassed = false;
    this.urlSaved = false;

    const timeout = setTimeout(() => {
      this.loading = false;
      this.urlStatus = 'Timeout — no response from ' + this.newApiUrl;
      this.cdr.detectChanges();
    }, 3000);

    this.http
      .get<{ db: boolean }>(`${this.newApiUrl}/health`, {
        headers: { 'Cache-Control': 'no-cache' },
      })
      .subscribe({
        next: (res) => {
          clearTimeout(timeout);
          this.loading = false;
          this.urlTestPassed = true;
          this.urlStatus = res.db
            ? 'Connection OK — database found.'
            : 'Connected but no database found. You may need to set up the DB.';
          this.cdr.detectChanges();
        },
        error: (err) => {
          clearTimeout(timeout);
          this.loading = false;
          this.urlTestPassed = false;
          this.urlStatus = `Failed: ${err.message ?? 'No response'}`;
          this.cdr.detectChanges();
        },
      });
  }

  saveUrl(): void {
    if (!this.urlTestPassed) return;
    this.configService.setApiUrl(this.newApiUrl);
    this.currentApiUrl = this.newApiUrl;
    this.hasCustomUrl = true;
    this.urlSaved = true;
    this.connectionStatus = null;
    this.cdr.detectChanges();
  }

  resetUrl(): void {
    this.configService.clearApiUrl();
    this.currentApiUrl = this.configService.apiUrl;
    this.newApiUrl = this.currentApiUrl;
    this.hasCustomUrl = false;
    this.urlSaved = false;
    this.urlTestPassed = false;
    this.urlStatus = '';
    this.connectionStatus = null;
    this.cdr.detectChanges();
  }

  checkConnection(): void {
    this.loading = true;
    this.connectionStatus = null;
    this.errorMsg = '';

    const timeout = setTimeout(() => {
      this.loading = false;
      this.errorMsg = 'Timeout — backend not reachable at ' + this.configService.apiUrl;
      this.cdr.detectChanges();
    }, 3000);

    this.http
      .get<{ db: boolean }>(`${this.configService.apiUrl}/health`, {
        headers: { 'Cache-Control': 'no-cache' },
      })
      .subscribe({
        next: (res) => {
          clearTimeout(timeout);
          this.connectionStatus = res.db;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          clearTimeout(timeout);
          this.connectionStatus = false;
          this.errorMsg = err.message ?? 'Failed';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  resetDb(mode: 'empty' | 'seed'): void {
    this.loading = true;
    this.resetStatus = '';
    this.resetError = false;

    this.http
      .post<{ message: string }>(`${this.configService.apiUrl}/admin/reset-db`, { mode })
      .subscribe({
        next: (res) => {
          this.resetStatus = res.message ?? 'Done';
          this.resetError = false;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.resetStatus = err.message ?? 'Failed';
          this.resetError = true;
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }
}
