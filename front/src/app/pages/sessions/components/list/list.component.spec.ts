import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SessionService } from '../../../../core/service/session.service';
import { ListComponent } from './list.component';

describe('ListComponent integration', () => {
  let fixture: ComponentFixture<ListComponent>;
  let http: HttpTestingController;
  let sessionService: SessionService;
  const sessions = [{
    id: 7,
    name: 'Morning Yoga',
    description: 'A mindful practice',
    date: '2026-05-01',
    teacher_id: 3,
    users: [1],
  }];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(ListComponent);
    http = TestBed.inject(HttpTestingController);
    sessionService = TestBed.inject(SessionService);
    sessionService.logIn({
      token: 'token',
      type: 'Bearer',
      id: 1,
      username: 'admin@example.test',
      firstName: 'Admin',
      lastName: 'User',
      admin: true,
    });
  });

  afterEach(() => http.verify());

  it('renders session information and admin Create/Edit actions', () => {
    fixture.detectChanges();
    http.expectOne('api/session').flush(sessions);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Rentals available');
    expect(text).toContain('Morning Yoga');
    expect(text).toContain('A mindful practice');
    expect(text).toContain('Create');
    expect(text).toContain('Detail');
    expect(text).toContain('Edit');
    expect(fixture.nativeElement.querySelector('[routerLink="create"]')).not.toBeNull();
  });

  it('shows available details but hides admin controls for a member', () => {
    sessionService.logIn({
      token: 'member-token',
      type: 'Bearer',
      id: 2,
      username: 'member@example.test',
      firstName: 'Member',
      lastName: 'User',
      admin: false,
    });
    fixture.detectChanges();
    http.expectOne('api/session').flush(sessions);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Morning Yoga');
    expect(text).toContain('Detail');
    expect(text).not.toContain('Create');
    expect(text).not.toContain('Edit');
  });
});
