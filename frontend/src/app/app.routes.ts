import { Routes } from '@angular/router';
import { LoginPage } from './pages/login-page/login-page';
import { ProductsPage } from './pages/products-page/products-page';
import { AssemblyLinesPage } from './pages/assembly-lines-page/assembly-lines-page';
import { WorkstationsPage } from './pages/workstations-page/workstations-page';
import { AssigmentsPage } from './pages/assigments-page/assigments-page';
import { SettingsPage } from './pages/settings-page/settings-page';

export const routes: Routes = [
  { path: '', redirectTo: 'assignments', pathMatch: 'full' },
  { path: 'assignments', component: AssigmentsPage },
  { path: 'products', component: ProductsPage },
  { path: 'assembly-lines', component: AssemblyLinesPage },
  { path: 'workstations', component: WorkstationsPage },
  { path: 'settings', component: SettingsPage },
  { path: 'login', component: LoginPage }
];
