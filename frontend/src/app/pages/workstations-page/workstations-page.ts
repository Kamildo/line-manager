import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ConfigService } from '../../services/config.service';
import { AuthService } from '../../services/auth.service';
// ─── Models ──────────────────────────────────────────────────────────────────

export interface Workstation {
  id: number;
  name: string;
  short_name: string;
  pc_name: string;
  has_assembly_lines: number | null;
}
interface Filters {
  name: string;
  short_name: string;
  pc_name: string;
  hasAssigned: boolean | null;
}

interface EditForm {
  name: string;
  short_name: string;
  pc_name: string;
}

export interface AssemblyLine {
  id: number;
  name: string;
  active: boolean;
  product_name?: string;
}

@Component({
  selector: 'app-workstations-page',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './workstations-page.html',
  styleUrl: './workstations-page.scss',
})

export class WorkstationsPage implements OnInit {
  allWorkstation: Workstation[] = [];
  filteredWorkstations: Workstation[] = [];
  isEditing = false;
  selectedWorkstation: Workstation | null = null;
  selectedLines: AssemblyLine[] = [];
  filters: Filters = { name: '', short_name: '', pc_name: '', hasAssigned: null }
  editForm: EditForm = { name: '', short_name: '', pc_name: '' }

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, public auth: AuthService, private configService: ConfigService) { }

  ngOnInit(): void {
    this.loadInitialData();
  }
  // ── Data ───────────────────────────────────────────────────────────────────

  private loadInitialData(): void {
    this.http.get<Workstation[]>(`${this.configService.apiUrl}/api/workstations_with_assembly_lines_flag`).subscribe({
      next: (data) => {
        console.log('workstations with lines flag:', data);
        this.allWorkstation = data;
        this.cdr.markForCheck();
        this.applyFilters();
      },
      error: (e) => console.error('workstations:', e),
    });
  }
  //'/api/workstations/:id/assembly_lines'
  private loadAssemlyLines(workstationId: number): void {
    this.http.get<AssemblyLine[]>(`${this.configService.apiUrl}/api/workstations/${workstationId}/assembly_lines`).subscribe({
      next: (data) => { this.selectedLines = data; this.cdr.markForCheck(); },
      error: (e) => console.error('assembly lines:', e),
    });
  }
  // ── Filtering ──────────────────────────────────────────────────────────────

  onFilterChange(): void { this.applyFilters(); }

  private applyFilters(): void {
    this.filteredWorkstations = this.allWorkstation.filter(w => {
      if (this.filters.name && !w.name.toLowerCase().includes(this.filters.name.toLowerCase())) return false;
      if (this.filters.short_name && !w.short_name.toLowerCase().includes(this.filters.short_name.toLowerCase())) return false;
      if (this.filters.pc_name && !w.pc_name.toLowerCase().includes(this.filters.pc_name.toLowerCase())) return false;
      //if (this.filters.hasAssigned !== null && Boolean(l.has_workstations) !== this.filters.hasAssigned) return false;
      if (this.filters.hasAssigned !== null && Boolean(w.has_assembly_lines) !== this.filters.hasAssigned) return false;
      return true;
    });
  }
  // ── Selection ──────────────────────────────────────────────────────────────

  onSelectWorkstation(workstation: Workstation): void {
    this.selectedWorkstation = workstation;
    this.isEditing = false;
    this.editForm = { name: workstation.name, short_name: workstation.short_name, pc_name: workstation.pc_name };
    this.loadAssemlyLines(workstation.id);
  }
  // ── CRUD ───────────────────────────────────────────────────────────────────

  onEdit(): void {
    if (!this.selectedWorkstation) return;
    this.isEditing = true;
    this.editForm = { name: this.selectedWorkstation.name, short_name: this.selectedWorkstation.short_name, pc_name: this.selectedWorkstation.pc_name };
  }

  onAddNew(): void {
    if (this.editForm.name == '') {
      return alert('Name is required');
    }
    else if (this.selectedWorkstation && !this.isEditing) {
      this.selectedWorkstation = null;
      return;
    }
    const body = { name: this.editForm.name, short_name: this.editForm.short_name, pc_name: this.editForm.pc_name };
    this.http.post<Workstation>(`${this.configService.apiUrl}/api/workstations`, body).subscribe({
      next: () => {
        this.selectedWorkstation = null;
        this.editForm = { name: '', short_name: '', pc_name: '' };
        this.loadInitialData();
      },
      error: (e) => console.error('add new:', e),
    });
  }

  onSave(): void {
    const body = { name: this.editForm.name, short_name: this.editForm.short_name, pc_name: this.editForm.pc_name };
    if (this.isEditing && this.selectedWorkstation) {
      const id = this.selectedWorkstation.id;
      this.http.put(`${this.configService.apiUrl}/api/workstations/${id}`, body).subscribe({
        next: () => {
          this.isEditing = false;
          this.loadInitialData();
        },
        error: (e) => console.error('save edit:', e),
      });
    }
  }

  onDelete(): void {
    if (!this.selectedWorkstation) return;
    // check if workstation is assigned to any assembly lines, if so alert user and get confirmation to unassign before deleting
    if (this.selectedLines.length > 0)
    {
      if (!confirm(`Workstation "${this.selectedWorkstation.name}" is assigned to ${this.selectedLines.length} assembly lines. Do you wish to continue?`)) return;
    }
    else if (!confirm(`Delete "${this.selectedWorkstation.name}"?`)) return;
    this.http.delete(`${this.configService.apiUrl}/api/workstations/workstations_assembly_line_unassign_all_and_delete/${this.selectedWorkstation.id}`).subscribe({
    next: () => {
        this.selectedWorkstation = null;
        this.editForm = { name: '', short_name: '', pc_name: '' };
        this.loadInitialData();
      },
      error: (e) => console.error('delete:', e),
    });
  }

  onCancel(): void {
    // restore form to selectedWorkstation if one exists, else blank
    if (this.selectedWorkstation) {
      this.editForm = { name: this.selectedWorkstation.name, short_name: this.selectedWorkstation.short_name, pc_name: this.selectedWorkstation.pc_name };
      this.isEditing = false;
    }
    else {
      this.editForm = { name: '', short_name: '', pc_name: '' };
      this.isEditing = false;
    }
  }

}
