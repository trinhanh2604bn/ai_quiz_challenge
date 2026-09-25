import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { ProfileService } from './profile.service';

export const requireProfile: CanActivateFn & CanMatchFn = () => {
  if (inject(ProfileService).hasProfile()) {
    return true;
  }

  return inject(Router).createUrlTree(['/profile/create']);
};

export const requireNoProfile: CanActivateFn & CanMatchFn = () => {
  if (!inject(ProfileService).hasProfile()) {
    return true;
  }

  return inject(Router).createUrlTree(['/']);
};
