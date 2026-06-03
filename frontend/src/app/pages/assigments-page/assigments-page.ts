import { Component } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-assigments-page',
  imports: [DragDropModule],
  templateUrl: './assigments-page.html',
  styleUrl: './assigments-page.scss',
})
export class AssigmentsPage {
  products = [
    { id: 1, name: 'Product A' },
    { id: 2, name: 'Product B' },
    { id: 3, name: 'Product C' },
  ];

  assemblyLines = [
    { id: 1, name: 'Line 1', productId: 1 },
    { id: 2, name: 'Line 2', productId: 1 },
    { id: 3, name: 'Line 3', productId: 2 },
    { id: 4, name: 'Line 4', productId: null },
    { id: 5, name: 'Line 5', productId: null },
  ];

  workstations = [
    { id: 1, name: 'Workstation 1' },
    { id: 2, name: 'Workstation 2' },
    { id: 3, name: 'Workstation 3' },
    { id: 4, name: 'Workstation 4' },
    { id: 5, name: 'Workstation 5' },
  ];

  assignments: Record<number, number[]> = {
    1: [1, 2],
    2: [3],
    3: [],
    4: [],
    5: [],
  };

  selectedProduct: number | null = null;
  selectedAL: number | null = null;

  // pending P->AL changes, reset on confirm/discard
  pendingAL: number[] = [];

  get visibleAL() {
    if (this.selectedProduct === null) return [];
    return this.assemblyLines.filter(
      al => al.productId === null || al.productId === this.selectedProduct
    );
  }

  isALAssignedToSelected(alId: number) {
    const al = this.assemblyLines.find(a => a.id === alId);
    return al?.productId === this.selectedProduct;
  }

  selectProduct(id: number) {
    this.selectedProduct = id;
    this.selectedAL = null;
    this.pendingAL = this.assemblyLines
      .filter(al => al.productId === id)
      .map(al => al.id);
  }

  toggleAL(alId: number) {
    if (this.pendingAL.includes(alId))
      this.pendingAL = this.pendingAL.filter(id => id !== alId);
    else
      this.pendingAL.push(alId);
  }

  selectAL(id: number) {
    this.selectedAL = id;
  }

  get assigned() {
    if (this.selectedAL === null) return [];
    return this.workstations.filter(ws =>
      this.assignments[this.selectedAL!].includes(ws.id)
    );
  }

  get unassigned() {
    if (this.selectedAL === null) return [];
    return this.workstations.filter(ws =>
      !this.assignments[this.selectedAL!].includes(ws.id)
    );
  }

  assign(wsId: number) {
    if (this.selectedAL === null) return;
    this.assignments[this.selectedAL].push(wsId);
  }

  unassign(wsId: number) {
    if (this.selectedAL === null) return;
    this.assignments[this.selectedAL] =
      this.assignments[this.selectedAL].filter(id => id !== wsId);
  }

  drop(event: CdkDragDrop<{ id: number; name: string }[]>) {
    if (event.previousContainer === event.container) return;
    const ws = event.previousContainer.data[event.previousIndex];
    if (event.container.id === 'assigned') this.assign(ws.id);
    else this.unassign(ws.id);
  }

  confirmProductAssign() {
    // apply pending to mock data
    this.assemblyLines = this.assemblyLines.map(al => {
      if (al.productId === this.selectedProduct && !this.pendingAL.includes(al.id))
        return { ...al, productId: null };
      if (this.pendingAL.includes(al.id))
        return { ...al, productId: this.selectedProduct };
      return al;
    });
  }

  confirmWSAssign() {
    // API call goes here later
    console.log('save WS assignments for AL', this.selectedAL, this.assignments[this.selectedAL!]);
  }
}
