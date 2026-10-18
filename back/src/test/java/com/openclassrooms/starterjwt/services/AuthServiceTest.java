package com.openclassrooms.starterjwt.services;

import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.payload.request.LoginRequest;
import com.openclassrooms.starterjwt.payload.request.SignupRequest;
import com.openclassrooms.starterjwt.repository.UserRepository;
import com.openclassrooms.starterjwt.security.jwt.JwtUtils;
import com.openclassrooms.starterjwt.security.services.UserDetailsImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthServiceTest {
    AuthenticationManager manager = mock(AuthenticationManager.class);
    PasswordEncoder encoder = mock(PasswordEncoder.class);
    JwtUtils jwt = mock(JwtUtils.class);
    UserRepository users = mock(UserRepository.class);
    AuthService service = new AuthService(manager, encoder, jwt, users);

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void registrationEncodesPasswordAndDuplicateDoesNotSave() {
        SignupRequest request = new SignupRequest();
        request.setEmail("new@example.com");
        request.setFirstName("First");
        request.setLastName("Last");
        request.setPassword("secret123");
        when(encoder.encode("secret123")).thenReturn("encoded");
        assertThat(service.register(request)).isTrue();
        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(users).save(saved.capture());
        assertThat(saved.getValue().getEmail()).isEqualTo("new@example.com");
        assertThat(saved.getValue().getPassword()).isEqualTo("encoded");
        assertThat(saved.getValue().isAdmin()).isFalse();
        when(users.existsByEmail("new@example.com")).thenReturn(true);
        assertThat(service.register(request)).isFalse();
        verify(users, times(1)).save(any());
        verify(encoder, times(1)).encode(any());
    }

    @Test
    void loginUsesAuthenticatedPrincipalAndTreatsAbsentAdminAsFalse() {
        LoginRequest request = new LoginRequest();
        request.setEmail("member@example.com");
        request.setPassword("secret123");
        UserDetailsImpl principal = UserDetailsImpl.builder().id(8L).username(request.getEmail())
                .firstName("First").lastName("Last").build();
        var authentication = new UsernamePasswordAuthenticationToken(principal, null, List.of());
        when(manager.authenticate(any())).thenReturn(authentication);
        when(jwt.generateJwtToken(authentication)).thenReturn("signed");
        var result = service.authenticate(request);
        assertThat(result.getToken()).isEqualTo("signed");
        assertThat(result.getAdmin()).isFalse();
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isSameAs(authentication);
        verifyNoInteractions(users);
    }

    @Test
    void badCredentialsDoNotIssueToken() {
        when(manager.authenticate(any())).thenThrow(new BadCredentialsException("Bad credentials"));
        assertThatThrownBy(() -> service.authenticate(new LoginRequest())).isInstanceOf(BadCredentialsException.class);
        verifyNoInteractions(jwt, users);
    }
}
