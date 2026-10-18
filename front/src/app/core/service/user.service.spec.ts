import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UserService } from './user.service';

describe('UserService integration', () => {
  let service: UserService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('retrieves an account by id', () => {
    const user = {
      id: 5,
      firstName: 'Yoga',
      lastName: 'Member',
      email: 'member@example.test',
      admin: false,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-02'),
    };
    service.getById('5').subscribe((result) => expect(result).toEqual(user));
    const request = http.expectOne('api/user/5');
    expect(request.request.method).toBe('GET');
    request.flush(user);
  });

  it('deletes an account', () => {
    service.delete('5').subscribe();
    const request = http.expectOne('api/user/5');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});
