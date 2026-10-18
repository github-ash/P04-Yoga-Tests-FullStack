import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService integration', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('registers a user with the API', () => {
    const requestBody = {
      email: 'new@example.test',
      firstName: 'First',
      lastName: 'Last',
      password: 'password',
    };
    service.register(requestBody).subscribe();
    const request = http.expectOne('/api/auth/register');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(requestBody);
    request.flush(null);
  });

  it('logs in and returns the complete session response', () => {
    const response = {
      token: 'jwt-token',
      type: 'Bearer',
      id: 9,
      username: 'member@example.test',
      firstName: 'Member',
      lastName: 'User',
      admin: false,
    };
    service.login({ email: response.username, password: 'password' })
      .subscribe((session) => expect(session).toEqual(response));
    const request = http.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: response.username, password: 'password' });
    request.flush(response);
  });
});
