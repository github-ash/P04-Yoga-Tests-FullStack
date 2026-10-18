import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { SessionService } from '../../core/service/session.service';
import { LoginComponent } from './login.component';

describe('LoginComponent integration', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let http: HttpTestingController;
  let router: Router;
  let sessionService: SessionService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, NoopAnimationsModule],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    sessionService = TestBed.inject(SessionService);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('shows required field messages and prevents invalid submission', () => {
    component.form.markAllAsTouched();
    fixture.detectChanges();

    expect(component.form.invalid).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Email is required.');
    expect(fixture.nativeElement.textContent).toContain('Password is required.');
    expect(fixture.nativeElement.querySelector('input[formControlName="email"]')
      .getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBe(true);
    fixture.nativeElement.querySelector('button[type="submit"]').click();
    http.expectNone('/api/auth/login');
  });

  it('logs in, saves the session and navigates to sessions', () => {
    const response = {
      token: 'jwt-token',
      type: 'Bearer',
      id: 12,
      username: 'member@example.test',
      firstName: 'Yoga',
      lastName: 'Member',
      admin: false,
    };
    component.form.setValue({ email: response.username, password: 'secret123' });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button[type="submit"]').click();

    const request = http.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: response.username, password: 'secret123' });
    request.flush(response);

    expect(sessionService.sessionInformation).toEqual(response);
    expect(sessionService.isLogged).toBe(true);
    expect(router.navigate).toHaveBeenCalledWith(['/sessions']);
  });

  it('shows an error when credentials are rejected', () => {
    component.form.setValue({ email: 'member@example.test', password: 'wrong123' });
    component.submit();
    http.expectOne('/api/auth/login').flush(
      { message: 'Invalid credentials' },
      { status: 401, statusText: 'Unauthorized' },
    );
    fixture.detectChanges();

    expect(component.onError).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('An error occurred');
  });
});
