import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { SessionService } from './core/service/session.service';
import { AppComponent } from './app.component';

describe('AppComponent integration', () => {
  let fixture: ComponentFixture<AppComponent>;
  let router: Router;
  let sessionService: SessionService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(AppComponent);
    router = TestBed.inject(Router);
    sessionService = TestBed.inject(SessionService);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  it('shows login and registration links while signed out', () => {
    expect(fixture.nativeElement.textContent).toContain('Login');
    expect(fixture.nativeElement.textContent).toContain('Register');
    expect(fixture.nativeElement.textContent).not.toContain('Logout');
  });

  it('shows the member navigation and logs out', () => {
    sessionService.logIn({
      token: 'token',
      type: 'Bearer',
      id: 1,
      username: 'member@example.test',
      firstName: 'Member',
      lastName: 'User',
      admin: false,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sessions');
    expect(fixture.nativeElement.textContent).toContain('Account');
    expect(fixture.nativeElement.textContent).toContain('Logout');

    fixture.nativeElement.textContent.includes('Logout');
    fixture.nativeElement.querySelector('.link:last-child').click();
    fixture.detectChanges();

    expect(sessionService.isLogged).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['']);
    expect(fixture.nativeElement.textContent).toContain('Login');
  });
});
