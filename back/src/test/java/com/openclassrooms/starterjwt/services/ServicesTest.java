package com.openclassrooms.starterjwt.services;

import com.openclassrooms.starterjwt.exception.BadRequestException;
import com.openclassrooms.starterjwt.exception.NotFoundException;
import com.openclassrooms.starterjwt.models.Session;
import com.openclassrooms.starterjwt.models.Teacher;
import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.repository.SessionRepository;
import com.openclassrooms.starterjwt.repository.TeacherRepository;
import com.openclassrooms.starterjwt.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ServicesTest {
    @Mock SessionRepository sessions;
    @Mock UserRepository users;
    @Mock TeacherRepository teachers;
    SessionService service;
    Session session;
    User user;

    @BeforeEach
    void setUp() {
        service = new SessionService(sessions, users);
        user = new User().setId(2L);
        session = Session.builder().id(1L).users(new ArrayList<>()).build();
    }

    @Test
    void sessionCrudDelegatesAndUpdateUsesPathId() {
        when(sessions.save(session)).thenReturn(session);
        when(sessions.findAll()).thenReturn(List.of(session));
        when(sessions.findById(1L)).thenReturn(Optional.of(session));
        assertThat(service.create(session)).isSameAs(session);
        assertThat(service.findAll()).containsExactly(session);
        assertThat(service.getById(1L)).isSameAs(session);
        assertThat(service.getById(999L)).isNull();
        assertThat(service.update(3L, session).getId()).isEqualTo(3L);
        service.delete(3L);
        verify(sessions, times(2)).save(session);
        verify(sessions).deleteById(3L);
    }

    @Test
    void participationAddsUserAndRejectsDuplicatesWithoutSaving() {
        when(sessions.findById(1L)).thenReturn(Optional.of(session));
        when(users.findById(2L)).thenReturn(Optional.of(user));
        service.participate(1L, 2L);
        assertThat(session.getUsers()).containsExactly(user);
        assertThatThrownBy(() -> service.participate(1L, 2L)).isInstanceOf(BadRequestException.class);
        verify(sessions).save(session);
    }

    @Test
    void participationFindsUserAfterOtherParticipants() {
        session.getUsers().add(new User().setId(3L));
        when(sessions.findById(1L)).thenReturn(Optional.of(session));
        when(users.findById(2L)).thenReturn(Optional.of(user));
        service.participate(1L, 2L);
        assertThat(session.getUsers()).hasSize(2);
    }

    @Test
    void missingSessionOrUserCannotParticipate() {
        assertThatThrownBy(() -> service.participate(1L, 2L)).isInstanceOf(NotFoundException.class);
        when(sessions.findById(1L)).thenReturn(Optional.of(session));
        assertThatThrownBy(() -> service.participate(1L, 2L)).isInstanceOf(NotFoundException.class);
        verify(sessions, never()).save(any());
    }

    @Test
    void withdrawalRemovesOnlySelectedParticipant() {
        User other = new User().setId(3L);
        session.getUsers().addAll(List.of(other, user));
        when(sessions.findById(1L)).thenReturn(Optional.of(session));
        service.noLongerParticipate(1L, 2L);
        assertThat(session.getUsers()).containsExactly(other);
        assertThatThrownBy(() -> service.noLongerParticipate(1L, 2L)).isInstanceOf(BadRequestException.class);
        verify(sessions).save(session);
    }

    @Test
    void missingSessionCannotWithdraw() {
        assertThatThrownBy(() -> service.noLongerParticipate(1L, 2L)).isInstanceOf(NotFoundException.class);
        verify(sessions, never()).save(any());
    }

    @Test
    void teacherLookupAndUserLookupPreserveMissingResults() {
        Teacher teacher = Teacher.builder().id(1L).build();
        when(teachers.findAll()).thenReturn(List.of(teacher));
        when(teachers.findById(1L)).thenReturn(Optional.of(teacher));
        TeacherService teacherService = new TeacherService(teachers);
        assertThat(teacherService.findAll()).containsExactly(teacher);
        assertThat(teacherService.findById(1L)).isSameAs(teacher);
        assertThat(teacherService.findById(99L)).isNull();
        when(users.findById(2L)).thenReturn(Optional.of(user));
        UserService userService = new UserService(users);
        assertThat(userService.findById(2L)).isSameAs(user);
        assertThat(userService.findById(99L)).isNull();
        userService.delete(2L);
        verify(users).deleteById(2L);
    }
}
