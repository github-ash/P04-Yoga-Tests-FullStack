import { HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SessionService } from '../core/service/session.service';
import { customJwtInterceptorFn } from './customJwtInterceptorFn';

describe('customJwtInterceptorFn', () => {
  let sessionService: SessionService;
  const request = new HttpRequest('GET', '/api/session');

  beforeEach(() => {
    TestBed.configureTestingModule({});
    sessionService = TestBed.inject(SessionService);
  });

  it('adds the bearer token to authenticated requests', () => {
    sessionService.logIn({
      token: 'jwt-token',
      type: 'Bearer',
      id: 1,
      username: 'user@example.test',
      firstName: 'Member',
      lastName: 'User',
      admin: false,
    });
    const next = jest.fn((forwardedRequest) => of(new HttpResponse({ body: forwardedRequest.url })));

    TestBed.runInInjectionContext(() => customJwtInterceptorFn(request, next)).subscribe();

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].headers.get('Authorization')).toBe('Bearer jwt-token');
    expect(request.headers.has('Authorization')).toBe(false);
  });

  it('leaves unauthenticated requests unchanged', () => {
    const next = jest.fn((forwardedRequest) => of(new HttpResponse({ body: forwardedRequest.url })));

    TestBed.runInInjectionContext(() => customJwtInterceptorFn(request, next)).subscribe();

    expect(next).toHaveBeenCalledWith(request);
    expect(next.mock.calls[0][0].headers.has('Authorization')).toBe(false);
  });
});
