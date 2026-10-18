import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { RegisterComponent } from './register.component';

describe('RegisterComponent integration', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent, NoopAnimationsModule],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('shows required field feedback and disables submission', () => {
    component.form.markAllAsTouched();
    fixture.detectChanges();

    expect(component.form.invalid).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Email is required.');
    expect(fixture.nativeElement.textContent).toContain('First name is required.');
    expect(fixture.nativeElement.textContent).toContain('Last name is required.');
    expect(fixture.nativeElement.textContent).toContain('Password is required.');
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBe(true);
    http.expectNone('/api/auth/register');
  });

  it('registers valid user data and navigates to login', () => {
    const body = {
      email: 'new@example.test',
      firstName: 'New',
      lastName: 'Member',
      password: 'secret123',
    };
    component.form.setValue(body);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button[type="submit"]').click();

    const request = http.expectOne('/api/auth/register');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    request.flush(null);

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('shows an error when registration fails', () => {
    component.form.setValue({
      email: 'existing@example.test',
      firstName: 'New',
      lastName: 'Member',
      password: 'secret123',
    });
    component.submit();
    http.expectOne('/api/auth/register').flush(
      { message: 'Email already registered' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(component.onError).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('An error occurred');
  });
});
