import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SessionService } from '../../../../core/service/session.service';
import { DetailComponent } from './detail.component';

describe('DetailComponent integration', () => {
  let fixture: ComponentFixture<DetailComponent>;
  let component: DetailComponent;
  let http: HttpTestingController;
  let router: Router;
  let sessionService: SessionService;
  const session = {
    id: 7,
    name: 'Morning Yoga',
    description: 'A mindful practice',
    date: '2026-05-01',
    teacher_id: 3,
    users: [1],
    createdAt: '2026-04-01',
    updatedAt: '2026-04-02',
  };
  const teacher = { id: 3, firstName: 'Yoga', lastName: 'Teacher' };

  async function renderDetail(admin: boolean, userId: number, attendees = session.users): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [DetailComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '7' }) } } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    sessionService = TestBed.inject(SessionService);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    sessionService.logIn({
      token: 'token',
      type: 'Bearer',
      id: userId,
      username: 'user@example.test',
      firstName: 'Yoga',
      lastName: 'Member',
      admin,
    });
    fixture = TestBed.createComponent(DetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    http.expectOne('api/session/7').flush({ ...session, users: attendees });
    http.expectOne('api/teacher/3').flush(teacher);
    fixture.detectChanges();
  }

  afterEach(() => {
    http?.verify();
    TestBed.resetTestingModule();
  });

  it('displays the session and teacher details and lets admins delete', async () => {
    await renderDetail(true, 1);

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Morning Yoga');
    expect(text).toContain('A mindful practice');
    expect(text).toContain('Yoga TEACHER');
    expect(text).toContain('1 attendees');
    expect(text).toContain('Delete');
    expect(text).not.toContain('Participate');

    const back = jest.spyOn(window.history, 'back').mockImplementation(() => undefined);
    component.back();
    expect(back).toHaveBeenCalledTimes(1);

    fixture.nativeElement.querySelector('button[color="warn"]').click();
    http.expectOne('api/session/7').flush(null);
    expect(router.navigate).toHaveBeenCalledWith(['sessions']);
  });

  it('lets a member participate and then cancel participation', async () => {
    await renderDetail(false, 2, []);
    expect(component.isParticipate).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Participate');

    fixture.nativeElement.querySelector('button[color="primary"]').click();
    http.expectOne('api/session/7/participate/2').flush(null);
    http.expectOne('api/session/7').flush({ ...session, users: [2] });
    http.expectOne('api/teacher/3').flush(teacher);
    fixture.detectChanges();

    expect(component.isParticipate).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Do not participate');
    fixture.nativeElement.querySelector('button[color="warn"]').click();
    http.expectOne('api/session/7/participate/2').flush(null);
    http.expectOne('api/session/7').flush({ ...session, users: [] });
    http.expectOne('api/teacher/3').flush(teacher);

    expect(component.isParticipate).toBe(false);
  });
});
