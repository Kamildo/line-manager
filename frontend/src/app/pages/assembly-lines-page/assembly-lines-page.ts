import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ConfigService } from '../../services/config.service';
import { AuthService } from '../../services/auth.service';
// ─── Models ──────────────────────────────────────────────────────────────────

export interface Product {
  id: number;
  name: string;
}

export interface Workstation {
  id: number;
  name: string;
  short_name: string;
  pc_name: string;
}

export interface WorkstationWithOrder extends Workstation {
  order_index: number;
}

export interface AssemblyLine {
  id: number;
  name: string;
  active: boolean;
  product_id: number | null;
  product_name?: string;
  has_workstations: number; // 0 | 1 from DB
}

interface Filters {
  name: string;
  productName: string;
  active: boolean | null;
  hasAssigned: boolean | null;
}

interface EditForm {
  name: string;
  active: boolean;
  productId: number | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-assembly-lines-page',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './assembly-lines-page.html',
  styleUrl: './assembly-lines-page.scss',
})
export class AssemblyLinesPage implements OnInit {

  allLines: AssemblyLine[] = [];
  filteredLines: AssemblyLine[] = [];
  products: Product[] = [];
  selectedLine: AssemblyLine | null = null;
  selectedWorkstations: WorkstationWithOrder[] = [];
  isEditing = false;

  filters: Filters = { name: '', productName: '', active: null, hasAssigned: null };
  editForm: EditForm = { name: '', active: true, productId: null };

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, public auth: AuthService, private configService: ConfigService) { }

  ngOnInit(): void {
    this.loadInitialData();
  }

  // ── Data ───────────────────────────────────────────────────────────────────

  private loadInitialData(): void {
    this.http.get<Product[]>(`${this.configService.apiUrl}/api/products`).subscribe({
      next: (data) => { this.products = data; this.cdr.markForCheck(); },
      error: (e) => console.error('products:', e),
    });

    this.http.get<AssemblyLine[]>(`${this.configService.apiUrl}/api/assembly_lines_with_workstation_flag`).subscribe({
      next: (data) => {
        this.allLines = data;
        this.applyFilters();
        this.cdr.markForCheck();
      },
      error: (e) => console.error('assembly_lines:', e),
    });
  }

  private reloadLines(selectId?: number): void {
    this.http.get<AssemblyLine[]>(`${this.configService.apiUrl}/api/assembly_lines_with_workstation_flag`).subscribe({
      next: (data) => {
        this.allLines = data;
        this.applyFilters();
        if (selectId) {
          const found = this.allLines.find(l => l.id === selectId);
          if (found) this.onSelectLine(found);
        }
        this.cdr.markForCheck();
      },
      error: (e) => console.error('reload:', e),
    });
  }

  private loadWorkstations(lineId: number): void {
    this.http.get<WorkstationWithOrder[]>(`${this.configService.apiUrl}/api/assembly_lines/${lineId}/workstations`).subscribe({
      next: (data) => { this.selectedWorkstations = data; this.cdr.markForCheck(); },
      error: (e) => console.error('workstations:', e),
    });
  }

  // ── Filtering ──────────────────────────────────────────────────────────────

  onFilterChange(): void { this.applyFilters(); }

  private applyFilters(): void {
    this.filteredLines = this.allLines.filter(l => {
      if (this.filters.name && !l.name.toLowerCase().includes(this.filters.name.toLowerCase())) return false;
      if (this.filters.productName && !(l.product_name ?? '').toLowerCase().includes(this.filters.productName.toLowerCase())) return false;
      if (this.filters.active !== null && Boolean(l.active) !== this.filters.active) return false;
      if (this.filters.hasAssigned !== null && Boolean(l.has_workstations) !== this.filters.hasAssigned) return false;
      return true;
    });
  }

  // ── Selection ──────────────────────────────────────────────────────────────

  onSelectLine(line: AssemblyLine): void {
    this.selectedLine = line;
    this.isEditing = false;
    this.editForm = { name: line.name, active: line.active, productId: line.product_id };
    this.selectedWorkstations = [];
    this.loadWorkstations(line.id);
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  onEdit(): void {
    if (!this.selectedLine) return;
    this.isEditing = true;
    this.editForm = { name: this.selectedLine.name, active: this.selectedLine.active, productId: this.selectedLine.product_id };
  }

  onAddNew(): void {
    if (this.editForm.name == '')
    {
      return alert('Name is required');
    }
    else if (this.selectedLine && !this.isEditing) {
      this.selectedLine = null;
      return;
    }
    const body = { name: this.editForm.name, active: this.editForm.active, product_id: null };
    this.http.post<AssemblyLine>(`${this.configService.apiUrl}/api/assembly_lines`, body).subscribe({
      next: () => {
        this.selectedLine = null;
        this.selectedWorkstations = [];
        this.editForm = { name: '', active: true, productId: null };
        this.reloadLines();
      },
      error: (e) => console.error('add new:', e),
    });
  }

  onSave(): void {
    const body = { name: this.editForm.name, active: this.editForm.active, product_id: this.editForm.productId };
    console.log('created:', 'start');
     if (this.isEditing && this.selectedLine) {
      const id = this.selectedLine.id;
      this.http.put(`${this.configService.apiUrl}/api/assembly_lines/${id}`, body).subscribe({
        next: () => {
          this.isEditing = false;
          this.reloadLines(id);
        },
        error: (e) => console.error('save edit:', e),
      });
    }
  }

  onDelete(): void {
    if (!this.selectedLine) return;
    if (this.selectedWorkstations.length > 0) {
      if (!confirm(`Assemly line "${this.selectedLine.name}" is assigned to ${this.selectedWorkstations.length} workstations. Do you wish to continue?`)) return;
    }
    else if (!confirm(`Delete "${this.selectedLine.name}"?`)) return;
    this.http.delete(`${this.configService.apiUrl}/api/assembly_lines/workstations_assembly_line_unassign_all_and_delete/${this.selectedLine.id}`).subscribe({
    next: () => {
        this.selectedLine = null;
        this.selectedWorkstations = [];
        this.editForm = { name: '', active: true, productId: null };
        this.reloadLines();
      },
      error: (e) => console.error('delete:', e),
    });
  }

  onCancel(): void {
      // restore form to selectedLine if one exists, else blank
    if (this.selectedLine)
    {
        this.editForm = { name: this.selectedLine.name, active: this.selectedLine.active, productId: this.selectedLine.product_id };
      this.isEditing = false;
    }
    else {
      this.editForm = { name: '', active: true, productId: null };
      this.isEditing = false;
          }    
  }
}
