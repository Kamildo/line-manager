import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
// ─── Models ──────────────────────────────────────────────────────────────────

export interface Product {
  id: number;
  name: string;
}
interface Filters {
  name: string;
}

interface EditForm {
  name: string;
}

@Component({
  selector: 'app-products-page',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './products-page.html',
  styleUrl: './products-page.scss',
})
export class ProductsPage implements OnInit {
  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  isEditing = false;
  selectedProduct: Product | null = null;
  filters: Filters = { name: '' }
  editForm: EditForm = { name: '' }

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, public auth: AuthService) { }

  ngOnInit(): void {
    this.loadInitialData();
  }
  // ── Data ───────────────────────────────────────────────────────────────────

  private loadInitialData(): void {
    this.http.get<Product[]>(`${environment.apiUrl}/api/products`).subscribe({
      next: (data) => {
        this.allProducts = data;
        this.cdr.markForCheck();
        this.applyFilters();
      },
      error: (e) => console.error('products:', e),
    });
  }
    // ── Filtering ──────────────────────────────────────────────────────────────

    onFilterChange(): void { this.applyFilters(); }

    private applyFilters(): void {
    this.filteredProducts = this.allProducts.filter(p => {
      if (this.filters.name && !p.name.toLowerCase().includes(this.filters.name.toLowerCase())) return false;
      return true;
    });
  }

  // ── Selection ──────────────────────────────────────────────────────────────

  onSelectProduct(product: Product): void {
    this.selectedProduct = product;
    this.isEditing = false;
    this.editForm = { name: product.name };
  }
  // ── CRUD ───────────────────────────────────────────────────────────────────

  onEdit(): void {
    if (!this.selectedProduct) return;
    this.isEditing = true;
    this.editForm = { name: this.selectedProduct.name };
  }

  onAddNew(): void {
    if (this.editForm.name == '') {
      return alert('Name is required');
    }
    else if (this.selectedProduct && !this.isEditing)
    {
      this.selectedProduct = null;
      return;
    }
    const body = { name: this.editForm.name };
    this.http.post<Product>(`${environment.apiUrl}/api/products`, body).subscribe({
      next: () => {
        this.selectedProduct = null;
        this.editForm = { name: '' };
        this.loadInitialData();
      },
      error: (e) => console.error('add new:', e),
    });
  }

  onSave(): void {
    const body = { name: this.editForm.name };
    if (this.isEditing && this.selectedProduct) {
      const id = this.selectedProduct.id;
      this.http.put(`${environment.apiUrl}/api/products/${id}`, body).subscribe({
        next: () => {
          this.isEditing = false;
          this.loadInitialData();
        },
        error: (e) => console.error('save edit:', e),
      });
    }
  }

  onDelete(): void {
    if (!this.selectedProduct) return;
    if (!confirm(`Delete "${this.selectedProduct.name}"?`)) return;
    this.http.delete(`${environment.apiUrl}/api/products/${this.selectedProduct.id}`).subscribe({
      next: () => {
        this.selectedProduct = null;
        this.editForm = { name: '' };
        this.loadInitialData();
      },
      error: (e) => console.error('delete:', e),
    });
  }

  onCancel(): void {
    // restore form to selectedProduct if one exists, else blank
    if (this.selectedProduct) {
      this.editForm = { name: this.selectedProduct.name };
      this.isEditing = false;
    }
    else {
      this.editForm = { name: '' };
      this.isEditing = false;
    }
  }

}
