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

  loadItems() {
    this.http.get<any[]>(`${environment.apiUrl}/api/items`).subscribe({
      next: (data) => {
        this.items = data;
        this.cdr.markForCheck();
      },
      error: (e) => console.log('Error:', e)
    });
  }

  loadAltItems() {
    this.http.get<any[]>(`${environment.apiUrl}/api/items2`).subscribe({
      next: (data) => {
        this.items = data;
        this.cdr.markForCheck();
      },
      error: (e) => console.log('Error:', e)
    });
  }


  ngOnInit() {
    this.loadItems();
  }

  
  doNothing() {
    console.log('nothing');
  }
 
}
