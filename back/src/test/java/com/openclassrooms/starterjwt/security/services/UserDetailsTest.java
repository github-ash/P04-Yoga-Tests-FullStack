package com.openclassrooms.starterjwt.security.services;

import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserDetailsTest {
    @Test
    void loadsAllAuthenticationFieldsAndRejectsUnknownEmail() {
        UserRepository repository = mock(UserRepository.class);
        User user = new User("member@example.com", "Last", "First", "encoded-password", true).setId(7L);
        when(repository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        UserDetailsServiceImpl service = new UserDetailsServiceImpl(repository);
        UserDetailsImpl result = (UserDetailsImpl) service.loadUserByUsername(user.getEmail());
        assertThat(result.getId()).isEqualTo(7L);
        assertThat(result.getUsername()).isEqualTo(user.getEmail());
        assertThat(result.getFirstName()).isEqualTo("First");
        assertThat(result.getLastName()).isEqualTo("Last");
        assertThat(result.getPassword()).isEqualTo("encoded-password");
        assertThat(result.getAdmin()).isTrue();
        assertThat(result.getAuthorities()).isEmpty();
        assertThat(result.isEnabled()).isTrue();
        assertThat(result.isAccountNonExpired()).isTrue();
        assertThat(result.isAccountNonLocked()).isTrue();
        assertThat(result.isCredentialsNonExpired()).isTrue();
        assertThatThrownBy(() -> service.loadUserByUsername("missing@example.com"))
                .isInstanceOf(UsernameNotFoundException.class).hasMessageContaining("missing@example.com");
    }

    @Test
    void identityEqualityAndHashCodeDependOnId() {
        UserDetailsImpl first = UserDetailsImpl.builder().id(1L).build();
        UserDetailsImpl sameId = UserDetailsImpl.builder().id(1L).username("different").build();
        assertThat(first).isEqualTo(first).isEqualTo(sameId);
        assertThat(first.hashCode()).isEqualTo(sameId.hashCode());
        assertThat(first.equals(null)).isFalse();
        assertThat(first.equals("other type")).isFalse();
        assertThat(first).isNotEqualTo(UserDetailsImpl.builder().id(2L).build());
        assertThat(UserDetailsImpl.builder().build()).isEqualTo(UserDetailsImpl.builder().build());
    }
}
