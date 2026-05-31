import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  apiStatus = 'checking...';

  constructor(private http: HttpClient) {
    this.http.get<any>('http://localhost:3000/health').subscribe({
      next: (r) => this.apiStatus = '✅ ' + r.status,
      error: () => this.apiStatus = '❌ unreachable'
    });
  }
}
