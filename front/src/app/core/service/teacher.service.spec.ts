import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TeacherService } from './teacher.service';

describe('TeacherService integration', () => {
  let service: TeacherService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TeacherService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('retrieves the teacher collection', () => {
    const teachers = [{ id: 1, firstName: 'Teacher', lastName: 'One' }];
    service.all().subscribe((result) => expect(result).toEqual(teachers));
    const request = http.expectOne('api/teacher');
    expect(request.request.method).toBe('GET');
    request.flush(teachers);
  });

  it('retrieves a teacher by id', () => {
    const teacher = { id: 3, firstName: 'Teacher', lastName: 'Three' };
    service.detail('3').subscribe((result) => expect(result).toEqual(teacher));
    const request = http.expectOne('api/teacher/3');
    expect(request.request.method).toBe('GET');
    request.flush(teacher);
  });
});
