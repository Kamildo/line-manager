import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
interface Product { id: number; name: string; }
interface AssemblyLine { id: number; name: string; product_id: number | null; }
interface Workstation { id: number; name: string; order_index?: number; }

@Component({
  selector: 'app-assigments-page',
  imports: [DragDropModule, CommonModule],
  templateUrl: './assigments-page.html',
  styleUrl: './assigments-page.scss',
})
export class AssigmentsPage {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  products: Product[] = [];
  assemblyLines: AssemblyLine[] = [];
  assignedWS: Workstation[] = [];
  unassignedWS: Workstation[] = [];
  savedAssignedWS: Workstation[] = [];
  savedUnassignedWS: Workstation[] = [];

  selectedProduct: number | null = null;
  selectedAL: number | null = null;

  pendingAL: number[] = [];
  savedPendingAL: number[] = [];

  pendingChangesProduct = false;
  pendingChangesAL = false;

  dialogSide: 'product' | 'al' | null = null;
  pendingProductSwitch: number | null = null;
  pendingALSwitch: number | null = null;


  constructor(public auth: AuthService) { }

  ngOnInit() {
    this.http.get<Product[]>(`${environment.apiUrl}/api/products`).subscribe({
      next: (data) => { this.products = data; this.cdr.markForCheck(); },
      error: (e) => console.error('products:', e)
    });
    this.http.get<AssemblyLine[]>(`${environment.apiUrl}/api/assembly_lines`).subscribe({
      next: (data) => { this.assemblyLines = data; this.cdr.markForCheck(); },
      error: (e) => console.error('assembly_lines:', e)
    });
  }

  // ── Product side ──────────────────────────────────────────

  get visibleAL() {
    if (this.selectedProduct === null) return [];
    return this.assemblyLines.filter(
      al => al.product_id === null || al.product_id === this.selectedProduct
    );
  }

  selectProduct(id: number) {
    if (id === this.selectedProduct) return;
    if (this.pendingChangesProduct) {
      this.dialogSide = 'product';
      this.pendingProductSwitch = id;
      return;
    }
    this.doSelectProduct(id);
  }

  doSelectProduct(id: number) {
    this.selectedProduct = id;
    this.pendingAL = this.assemblyLines
      .filter(al => al.product_id === id)
      .map(al => al.id);
    this.savedPendingAL = [...this.pendingAL];
    this.pendingChangesProduct = false;
  }

  toggleAL(alId: number) {
    if (this.pendingAL.includes(alId))
      this.pendingAL = this.pendingAL.filter(id => id !== alId);
    else
      this.pendingAL.push(alId);
    this.pendingChangesProduct = !this.arraysEqual(this.pendingAL, this.savedPendingAL);
  }

  confirmProductAssign() {
//    console.log('start:');
    const payload = {
      product_id: this.selectedProduct,
      al_ids: this.pendingAL
    };
  //  console.log('sending:', JSON.stringify(payload));
    this.http.put(`${environment.apiUrl}/api/assembly_lines/assign-products`, payload).subscribe({
      next: () => {
     //   console.log('success');
        this.assemblyLines = this.assemblyLines.map(al => {
          if (al.product_id === this.selectedProduct && !this.pendingAL.includes(al.id))
            return { ...al, product_id: null };
          if (this.pendingAL.includes(al.id))
            return { ...al, product_id: this.selectedProduct };
          return al;
        });
        this.savedPendingAL = [...this.pendingAL];
        this.pendingChangesProduct = false;
      },
      error: (e) => console.error('assign product:', e)
    });
  }

  // ── AL side ───────────────────────────────────────────────

  selectAL(id: number) {
    if (id === this.selectedAL) return;
    if (this.pendingChangesAL) {
      this.dialogSide = 'al';
      this.pendingALSwitch = id;
      return;
    }
    this.doSelectAL(id);
  }

  doSelectAL(id: number) {
    this.selectedAL = id;
    this.pendingChangesAL = false;
    this.http.get<Workstation[]>(`${environment.apiUrl}/api/assembly_lines/${id}/workstations`).subscribe({
      next: (data) => {
        this.assignedWS = data;
        this.savedAssignedWS = [...data];
        this.cdr.markForCheck();
      },
      error: (e) => console.error('assigned ws:', e)
    });
    this.http.get<Workstation[]>(`${environment.apiUrl}/api/assembly_lines/${id}/workstations/unassigned`).subscribe({
      next: (data) => {
        this.unassignedWS = data;
        this.savedUnassignedWS = [...data];
        this.cdr.markForCheck();
      },
      error: (e) => console.error('unassigned ws:', e)
    });
  }

  assign(wsId: number) {
    const ws = this.unassignedWS.find(w => w.id === wsId);
    if (!ws) return;
    this.unassignedWS = this.unassignedWS.filter(w => w.id !== wsId);
    this.assignedWS = [...this.assignedWS, ws];
    this.pendingChangesAL = true;
  }

  unassign(wsId: number) {
    const ws = this.assignedWS.find(w => w.id === wsId);
    if (!ws) return;
    this.assignedWS = this.assignedWS.filter(w => w.id !== wsId);
    this.unassignedWS = [...this.unassignedWS, ws];
    this.pendingChangesAL = true;
  }

  drop(event: CdkDragDrop<Workstation[]>) {
    if (event.previousContainer === event.container) {
      const list = [...event.container.data];
      moveItemInArray(list, event.previousIndex, event.currentIndex);
      if (event.container.id === 'assigned') this.assignedWS = list;
      else this.unassignedWS = list;
      this.pendingChangesAL = true;
    } else {
      const ws = event.previousContainer.data[event.previousIndex];
      if (event.container.id === 'assigned') this.assign(ws.id);
      else this.unassign(ws.id);
    }
  }

  confirmWSAssign() {
    const payload = this.assignedWS.map((ws, index) => ({
      id: ws.id,
      order_index: index + 1
    }));
    console.log('sending:', JSON.stringify(payload));
    this.http.put(`${environment.apiUrl}/api/assembly_lines/${this.selectedAL}/workstations`, payload).subscribe({
      next: () => {
        this.savedAssignedWS = [...this.assignedWS];
        this.savedUnassignedWS = [...this.unassignedWS];
        this.pendingChangesAL = false;
      },
      error: (e) => console.error('assign workstations:', e)
    });
  }

  // ── Dialog ────────────────────────────────────────────────

  dialogConfirm() {
    if (this.dialogSide === 'product') {
      this.confirmProductAssign();
      const next = this.pendingProductSwitch!;
      this.dialogSide = null;
      this.pendingProductSwitch = null;
      this.doSelectProduct(next);
    } else if (this.dialogSide === 'al') {
      this.confirmWSAssign();
      const next = this.pendingALSwitch!;
      this.dialogSide = null;
      this.pendingALSwitch = null;
      this.doSelectAL(next);
    }
  }

  dialogDiscard() {
    if (this.dialogSide === 'product') {
      this.pendingAL = [...this.savedPendingAL];
      this.pendingChangesProduct = false;
      const next = this.pendingProductSwitch!;
      this.dialogSide = null;
      this.pendingProductSwitch = null;
      this.doSelectProduct(next);
    } else if (this.dialogSide === 'al') {
      this.assignedWS = [...this.savedAssignedWS];
      this.unassignedWS = [...this.savedUnassignedWS];
      this.pendingChangesAL = false;
      const next = this.pendingALSwitch!;
      this.dialogSide = null;
      this.pendingALSwitch = null;
      this.doSelectAL(next);
    }
  }

  discardProduct() {
    this.pendingAL = [...this.savedPendingAL];
    this.pendingChangesProduct = false;
  }

  discardAL() {
    this.assignedWS = [...this.savedAssignedWS];
    this.unassignedWS = [...this.savedUnassignedWS];
    this.pendingChangesAL = false;
  }

  // ── Utils ─────────────────────────────────────────────────

  private arraysEqual(a: number[], b: number[]) {
    return a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);
  }
}
