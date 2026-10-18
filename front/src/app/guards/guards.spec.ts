import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { SessionService } from '../core/service/session.service';
import { AuthGuard } from './auth.guard';
import { UnauthGuard } from './unauth.guard';

describe('route guards', () => {
  let sessionService: SessionService;
  let router: Router;
  let authGuard: AuthGuard;
  let unauthGuard: UnauthGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    sessionService = TestBed.inject(SessionService);
    router = TestBed.inject(Router);
    authGuard = TestBed.inject(AuthGuard);
    unauthGuard = TestBed.inject(UnauthGuard);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('allows authenticated users and redirects signed-out users to login', () => {
    expect(authGuard.canActivate()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['login']);

    sessionService.logIn({
      token: 'token',
      type: 'Bearer',
      id: 1,
      username: 'user@example.test',
      firstName: 'Member',
      lastName: 'User',
      admin: false,
    });
    expect(authGuard.canActivate()).toBe(true);
  });

  it('allows signed-out users and redirects authenticated users to sessions', () => {
    expect(unauthGuard.canActivate()).toBe(true);
    sessionService.logIn({
      token: 'token',
      type: 'Bearer',
      id: 1,
      username: 'user@example.test',
      firstName: 'Member',
      lastName: 'User',
      admin: false,
    });
    expect(unauthGuard.canActivate()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['sessions']);
  });
});
