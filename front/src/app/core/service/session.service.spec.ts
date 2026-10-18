import { TestBed } from '@angular/core/testing';
import { SessionInformation } from '../models/sessionInformation.interface';
import { SessionService } from './session.service';

describe('SessionService', () => {
  let service: SessionService;
  const session: SessionInformation = {
    token: 'signed-token',
    type: 'Bearer',
    id: 4,
    username: 'member@example.test',
    firstName: 'Yoga',
    lastName: 'Member',
    admin: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionService);
  });

  it('emits the logged-out state initially and updates it on login/logout', () => {
    const states: boolean[] = [];
    const subscription = service.$isLogged().subscribe((logged) => states.push(logged));

    service.logIn(session);
    expect(service.isLogged).toBe(true);
    expect(service.sessionInformation).toEqual(session);

    service.logOut();
    expect(service.isLogged).toBe(false);
    expect(service.sessionInformation).toBeUndefined();
    expect(states).toEqual([false, true, false]);
    subscription.unsubscribe();
  });
});
