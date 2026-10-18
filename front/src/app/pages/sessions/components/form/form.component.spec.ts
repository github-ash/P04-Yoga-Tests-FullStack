import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Session } from '../../../../core/models/session.interface';
import { SessionService } from '../../../../core/service/session.service';
import { FormComponent } from './form.component';

describe('FormComponent integration', () => {
  let fixture: ComponentFixture<FormComponent>;
  let component: FormComponent;
  let http: HttpTestingController;
  let router: Router;
  let sessionService: SessionService;
  let routeId: string | null;
  let isUpdate: boolean;
  let isAdmin: boolean;
  const teachers = [{ id: 3, firstName: 'Teacher', lastName: 'One' }];
  const session: Session = {
    id: 7,
    name: 'Morning Yoga',
    description: 'A mindful practice',
    date: new Date('2026-05-01T00:00:00.000Z'),
    teacher_id: 3,
    users: [1],
  };

  async function renderForm(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [FormComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: routeId }) } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(FormComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    sessionService = TestBed.inject(SessionService);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    sessionService.logIn({
      token: 'token',
      type: 'Bearer',
      id: 1,
      username: isAdmin ? 'admin@example.test' : 'member@example.test',
      firstName: 'Yoga',
      lastName: 'User',
      admin: isAdmin,
    });
    if (isUpdate) {
      Object.defineProperty(router, 'url', { configurable: true, get: () => '/sessions/update/7' });
    }
    fixture.detectChanges();
    if (isUpdate) {
      http.expectOne('api/session/7').flush(session);
      fixture.detectChanges();
    }
    if (isAdmin) {
      http.expectOne('api/teacher').flush(teachers);
    }
  }

  beforeEach(() => {
    routeId = null;
    isUpdate = false;
    isAdmin = true;
  });

  afterEach(() => {
    http?.verify();
    TestBed.resetTestingModule();
  });

  it('shows the required feedback for an empty create form', async () => {
    await renderForm();
    component.sessionForm?.markAllAsTouched();
    fixture.detectChanges();

    expect(component.sessionForm?.invalid).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Name is required.');
    expect(fixture.nativeElement.textContent).toContain('Date is required.');
    expect(fixture.nativeElement.textContent).toContain('Select a teacher.');
    expect(fixture.nativeElement.textContent).toContain('Description is required.');
    expect(fixture.nativeElement.querySelector('input[formControlName="name"]')
      .getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBe(true);
  });

  it('creates a session and navigates back to the list', async () => {
    await renderForm();
    component.sessionForm?.setValue({
      name: 'Morning Yoga',
      date: '2026-05-01',
      teacher_id: 3,
      description: 'A mindful practice',
    });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button[type="submit"]').click();

    const request = http.expectOne('api/session');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      name: 'Morning Yoga',
      date: '2026-05-01',
      teacher_id: 3,
      description: 'A mindful practice',
    });
    request.flush(session);

    expect(router.navigate).toHaveBeenCalledWith(['sessions']);
  });

  it('loads existing values and updates a session', async () => {
    routeId = '7';
    isUpdate = true;
    await renderForm();

    expect(component.onUpdate).toBe(true);
    expect(component.sessionForm?.getRawValue()).toEqual({
      name: 'Morning Yoga',
      date: '2026-05-01',
      teacher_id: 3,
      description: 'A mindful practice',
    });
    component.sessionForm?.controls['name'].setValue('Evening Yoga');
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button[type="submit"]').click();

    const request = http.expectOne('api/session/7');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body.name).toBe('Evening Yoga');
    request.flush(session);

    expect(router.navigate).toHaveBeenCalledWith(['sessions']);
  });

  it('redirects a non-admin away from session management', async () => {
    isAdmin = false;
    await renderForm();

    expect(router.navigate).toHaveBeenCalledWith(['/sessions']);
    expect(component.sessionForm).toBeUndefined();
  });
});
