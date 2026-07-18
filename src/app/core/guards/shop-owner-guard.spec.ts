import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { shopOwnerGuard } from './shop-owner-guard';

describe('shopOwnerGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => shopOwnerGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
