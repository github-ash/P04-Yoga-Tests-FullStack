package com.openclassrooms.starterjwt.mapper;

import com.openclassrooms.starterjwt.dto.SessionDto;
import com.openclassrooms.starterjwt.dto.TeacherDto;
import com.openclassrooms.starterjwt.dto.UserDto;
import com.openclassrooms.starterjwt.models.Session;
import com.openclassrooms.starterjwt.models.Teacher;
import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.services.TeacherService;
import com.openclassrooms.starterjwt.services.UserService;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Date;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class MappersTest {
    final TeacherMapper teachers = Mappers.getMapper(TeacherMapper.class);
    final UserMapper users = Mappers.getMapper(UserMapper.class);
    final SessionMapper sessions = Mappers.getMapper(SessionMapper.class);

    @Test
    void userAndTeacherRoundTripsKeepAllFields() {
        LocalDateTime now = LocalDateTime.of(2026, 1, 1, 10, 0);
        Teacher teacher = Teacher.builder().id(3L).firstName("Jane").lastName("Doe").createdAt(now).updatedAt(now).build();
        TeacherDto teacherDto = teachers.toDto(teacher);
        assertThat(teacherDto.getFirstName()).isEqualTo("Jane");
        assertThat(teachers.toEntity(teacherDto)).usingRecursiveComparison().isEqualTo(teacher);
        assertThat(teachers.toEntity(teachers.toDto(List.of(teacher)))).usingRecursiveComparison().isEqualTo(List.of(teacher));
        User user = User.builder().id(5L).email("jane@example.com").firstName("Jane").lastName("Doe")
                .password("hashed").admin(true).createdAt(now).updatedAt(now).build();
        UserDto userDto = users.toDto(user);
        assertThat(userDto.isAdmin()).isTrue();
        assertThat(users.toEntity(userDto)).usingRecursiveComparison().isEqualTo(user);
        assertThat(users.toEntity(users.toDto(List.of(user)))).usingRecursiveComparison().isEqualTo(List.of(user));
    }

    @Test
    void sessionResolvesAssociationsAndRoundTripsAllFields() {
        TeacherService teacherService = mock(TeacherService.class);
        UserService userService = mock(UserService.class);
        ReflectionTestUtils.setField(sessions, "teacherService", teacherService);
        ReflectionTestUtils.setField(sessions, "userService", userService);
        Teacher teacher = Teacher.builder().id(3L).build();
        User user = new User().setId(5L);
        when(teacherService.findById(3L)).thenReturn(teacher);
        when(userService.findById(5L)).thenReturn(user);
        LocalDateTime now = LocalDateTime.of(2026, 1, 1, 10, 0);
        SessionDto dto = new SessionDto(1L, "Yoga", new Date(1000), 3L, "Relax", List.of(5L), now, now);
        Session session = sessions.toEntity(dto);
        assertThat(session.getTeacher()).isSameAs(teacher);
        assertThat(session.getUsers()).containsExactly(user);
        assertThat(sessions.toDto(session)).usingRecursiveComparison().isEqualTo(dto);
        assertThat(sessions.toDto(sessions.toEntity(List.of(dto)))).usingRecursiveComparison().isEqualTo(List.of(dto));
        dto.setUsers(List.of(99L));
        assertThat(sessions.toEntity(dto).getUsers()).containsExactly((User) null);
    }

    @Test
    void nullAssociationsAndCollectionsAreHandled() {
        SessionDto dto = new SessionDto();
        Session entity = sessions.toEntity(dto);
        assertThat(entity.getTeacher()).isNull();
        assertThat(entity.getUsers()).isEmpty();
        assertThat(sessions.toDto(Session.builder().build()).getUsers()).isEmpty();
        assertThat(sessions.toDto(Session.builder().teacher(new Teacher()).build()).getTeacher_id()).isNull();
        assertThat(sessions.toDto(entity).getTeacher_id()).isNull();
        assertThat(sessions.toEntity((SessionDto) null)).isNull();
        assertThat(sessions.toDto((Session) null)).isNull();
        assertThat(sessions.toEntity((List<SessionDto>) null)).isNull();
        assertThat(sessions.toDto((List<Session>) null)).isNull();
        assertThat(sessions.toEntity(Arrays.asList((SessionDto) null))).containsExactly((Session) null);
        assertThat(sessions.toDto(Arrays.asList((Session) null))).containsExactly((SessionDto) null);
        assertThat(teachers.toEntity((TeacherDto) null)).isNull();
        assertThat(teachers.toDto((Teacher) null)).isNull();
        assertThat(teachers.toEntity((List<TeacherDto>) null)).isNull();
        assertThat(teachers.toDto((List<Teacher>) null)).isNull();
        assertThat(users.toEntity((UserDto) null)).isNull();
        assertThat(users.toDto((User) null)).isNull();
        assertThat(users.toEntity((List<UserDto>) null)).isNull();
        assertThat(users.toDto((List<User>) null)).isNull();
    }
}
