import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements OnInit {
  items: any[] = [];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  loadProducts() {
    this.http.get<any[]>(`${environment.apiUrl}/api/products`).subscribe({
      next: (data) => {
        this.items = data;
        this.cdr.markForCheck();
      },
      error: (e) => console.log('Error:', e)
    });
  }

  loadAssembly_lines() {
    this.http.get<any[]>(`${environment.apiUrl}/api/assembly_lines`).subscribe({
      next: (data) => {
        this.items = data;
        this.cdr.markForCheck();
      },
      error: (e) => console.log('Error:', e)
    });
  }
  
  loadWorkstations() {
    this.http.get<any[]>(`${environment.apiUrl}/api/workstations`).subscribe({
      next: (data) => {
        this.items = data;
        this.cdr.markForCheck();
      },
      error: (e) => console.log('Error:', e)
    });
  }

  ngOnInit() {
    this.loadProducts();
  }

 
}
