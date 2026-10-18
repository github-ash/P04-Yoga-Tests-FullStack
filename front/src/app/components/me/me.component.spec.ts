import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { SessionService } from '../../core/service/session.service';
import { MeComponent } from './me.component';

describe('MeComponent integration', () => {
  let fixture: ComponentFixture<MeComponent>;
  let http: HttpTestingController;
  let router: Router;
  let sessionService: SessionService;
  const user = {
    id: 5,
    firstName: 'Yoga',
    lastName: 'Member',
    email: 'member@example.test',
    admin: false,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-02',
  };

  async function renderAccount(admin: boolean): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [MeComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    sessionService = TestBed.inject(SessionService);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    sessionService.logIn({
      token: 'token',
      type: 'Bearer',
      id: user.id,
      username: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      admin,
    });
    fixture = TestBed.createComponent(MeComponent);
    fixture.detectChanges();
    http.expectOne(`api/user/${user.id}`).flush({ ...user, admin });
    fixture.detectChanges();
  }

  afterEach(() => {
    http?.verify();
    TestBed.resetTestingModule();
  });

  it('displays account details and permits members to delete their account', async () => {
    await renderAccount(false);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('User information');
    expect(text).toContain('Yoga MEMBER');
    expect(text).toContain('member@example.test');
    expect(text).toContain('Delete my account');

    const back = jest.spyOn(window.history, 'back').mockImplementation(() => undefined);
    fixture.componentInstance.back();
    expect(back).toHaveBeenCalledTimes(1);

    fixture.nativeElement.querySelector('button[color="warn"]').click();
    http.expectOne('api/user/5').flush(null);

    expect(sessionService.isLogged).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('displays admin status without offering account deletion', async () => {
    await renderAccount(true);
    expect(fixture.nativeElement.textContent).toContain('You are admin');
    expect(fixture.nativeElement.textContent).not.toContain('Delete my account');
    expect(fixture.nativeElement.querySelector('button[color="warn"]')).toBeNull();
  });
});
