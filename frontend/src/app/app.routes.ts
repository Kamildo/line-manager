import { CanActivateFn, Router,Routes } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { LoginPage } from './pages/login-page/login-page';
import { ProductsPage } from './pages/products-page/products-page';
import { AssemblyLinesPage } from './pages/assembly-lines-page/assembly-lines-page';
import { WorkstationsPage } from './pages/workstations-page/workstations-page';
import { AssigmentsPage } from './pages/assigments-page/assigments-page';
import { SettingsPage } from './pages/settings-page/settings-page';

const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  router.navigate(['/login']);
  return false;
};

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginPage },
  { path: 'assignments', component: AssigmentsPage, canActivate: [authGuard] },
  { path: 'products', component: ProductsPage, canActivate: [authGuard] },
  { path: 'assembly-lines', component: AssemblyLinesPage, canActivate: [authGuard] },
  { path: 'workstations', component: WorkstationsPage, canActivate: [authGuard] },
  { path: 'settings', component: SettingsPage, canActivate: [authGuard] },
];
