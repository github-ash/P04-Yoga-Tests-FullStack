import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Session } from '../models/session.interface';
import { SessionApiService } from './session-api.service';

describe('SessionApiService integration', () => {
  let service: SessionApiService;
  let http: HttpTestingController;
  const session: Session = {
    id: 7,
    name: 'Morning Yoga',
    description: 'A mindful practice',
    date: new Date('2026-05-01T00:00:00.000Z'),
    teacher_id: 3,
    users: [1],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SessionApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads all sessions', () => {
    service.all().subscribe((sessions) => expect(sessions).toEqual([session]));
    http.expectOne('api/session').flush([session]);
  });

  it('loads one session by id', () => {
    service.detail('7').subscribe((result) => expect(result).toEqual(session));
    http.expectOne('api/session/7').flush(session);
  });

  it('creates and updates a session with the provided values', () => {
    service.create(session).subscribe((result) => expect(result).toEqual(session));
    const createRequest = http.expectOne('api/session');
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual(session);
    createRequest.flush(session);

    service.update('7', session).subscribe((result) => expect(result).toEqual(session));
    const updateRequest = http.expectOne('api/session/7');
    expect(updateRequest.request.method).toBe('PUT');
    expect(updateRequest.request.body).toEqual(session);
    updateRequest.flush(session);
  });

  it('deletes a session', () => {
    service.delete('7').subscribe();
    const request = http.expectOne('api/session/7');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });

  it('adds and removes a participant', () => {
    service.participate('7', '2').subscribe();
    const addRequest = http.expectOne('api/session/7/participate/2');
    expect(addRequest.request.method).toBe('POST');
    expect(addRequest.request.body).toBeNull();
    addRequest.flush(null);

    service.unParticipate('7', '2').subscribe();
    const removeRequest = http.expectOne('api/session/7/participate/2');
    expect(removeRequest.request.method).toBe('DELETE');
    removeRequest.flush(null);
  });
});
