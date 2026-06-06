import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private _apiUrl: string;

  constructor() {
    this._apiUrl = localStorage.getItem('apiUrl') ?? environment.apiUrl;
  }

  get apiUrl(): string {
    return this._apiUrl;
  }

  setApiUrl(url: string): void {
    this._apiUrl = url;
    localStorage.setItem('apiUrl', url);
  }

  clearApiUrl(): void {
    this._apiUrl = environment.apiUrl;
    localStorage.removeItem('apiUrl');
  }
}
