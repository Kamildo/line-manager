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

  // Health / connection
  connectionStatus: boolean | null = null;
  dbPath: string | null = null;
  errorMsg = '';

  // DB path reconfigure (admin)
  newDbPath = '';
  reconfigureStatus = '';
  reconfigureError = false;

  // Init DB (user + admin when db: false)
  initStatus = '';
  initError = false;

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
      .get<{ db: boolean; dbPath: string }>(`${this.newApiUrl}/health`, {
        headers: { 'Cache-Control': 'no-cache' },
      })
      .subscribe({
        next: (res) => {
          clearTimeout(timeout);
          this.loading = false;
          this.urlTestPassed = true;
          this.urlStatus = res.db
            ? `Connected — database found at: ${res.dbPath}`
            : `Connected — no database found (path: ${res.dbPath})`;
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
    this.dbPath = null;
    this.checkConnection();
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
    this.dbPath = null;
    this.checkConnection();
    this.cdr.detectChanges();
  }

  checkConnection(): void {
    this.loading = true;
    this.connectionStatus = null;
    this.errorMsg = '';
    this.dbPath = null;

    const timeout = setTimeout(() => {
      this.loading = false;
      this.connectionStatus = false;
      this.errorMsg = 'Timeout — backend not reachable at ' + this.configService.apiUrl;
      this.cdr.detectChanges();
    }, 3000);

    this.http
      .get<{ db: boolean; dbPath: string }>(`${this.configService.apiUrl}/health`, {
        headers: { 'Cache-Control': 'no-cache' },
      })
      .subscribe({
        next: (res) => {
          clearTimeout(timeout);
          this.connectionStatus = res.db;
          this.dbPath = res.dbPath;
          this.newDbPath = res.dbPath === 'default' ? '' : res.dbPath;
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

  // USER + ADMIN: init DB at current path
  initDb(mode: 'empty' | 'seed'): void {
    this.loading = true;
    this.initStatus = '';
    this.initError = false;

    this.http
      .post<{ db: boolean; dbPath: string }>(`${this.configService.apiUrl}/initdb`, { mode })
      .subscribe({
        next: (res) => {
          this.initStatus = res.db
            ? `Database created at: ${res.dbPath}`
            : 'Init called but database still not found.';
          this.initError = !res.db;
          this.connectionStatus = res.db;
          this.dbPath = res.dbPath;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.initStatus = err.message ?? 'Failed';
          this.initError = true;
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  // ADMIN ONLY: change DB path
  reconfigureDb(): void {
    if (!this.newDbPath) return;
    this.loading = true;
    this.reconfigureStatus = '';
    this.reconfigureError = false;

    this.http
      .post<{ message: string; dbPath: string }>(`${this.configService.apiUrl}/admin/reconfigure`, {
        dbPath: this.newDbPath,
      })
      .subscribe({
        next: (res) => {
          this.reconfigureStatus = res.message ?? 'Path updated';
          this.reconfigureError = false;
          this.loading = false;
          setTimeout(() => this.checkConnection(), 1000);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.reconfigureStatus = err.message ?? 'Failed';
          this.reconfigureError = true;
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }
  resetDbPath(): void {
    this.loading = true;
    this.reconfigureStatus = '';
    this.http
      .post<{ message: string; dbPath: string }>(`${this.configService.apiUrl}/admin/reset-path`, {})
      .subscribe({
        next: (res) => {
          this.reconfigureStatus = res.message;
          this.reconfigureError = false;
          this.newDbPath = '';
          this.loading = false;
          setTimeout(() => this.checkConnection(), 1000);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.reconfigureStatus = err.message ?? 'Failed';
          this.reconfigureError = true;
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }
}
