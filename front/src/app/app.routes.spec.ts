import { routes } from './app.routes';
import { AuthGuard } from './guards/auth.guard';
import { UnauthGuard } from './guards/unauth.guard';

describe('application routes', () => {
  it('protects member and guest pages with the expected guards', () => {
    expect(routes.find((route) => route.path === 'login')?.canActivate).toContain(UnauthGuard);
    expect(routes.find((route) => route.path === 'register')?.canActivate).toContain(UnauthGuard);
    expect(routes.find((route) => route.path === 'sessions')?.canActivate).toContain(AuthGuard);
    expect(routes.find((route) => route.path === 'me')?.canActivate).toContain(AuthGuard);
  });

  it('provides the session pages and not-found fallback', () => {
    const sessions = routes.find((route) => route.path === 'sessions');
    expect(sessions?.children?.map((route) => route.path)).toEqual([
      '',
      'detail/:id',
      'create',
      'update/:id',
    ]);
    expect(routes.find((route) => route.path === '**')?.redirectTo).toBe('404');
  });
});
