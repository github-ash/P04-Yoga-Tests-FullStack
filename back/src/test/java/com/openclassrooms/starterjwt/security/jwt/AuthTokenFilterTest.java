package com.openclassrooms.starterjwt.security.jwt;

import com.openclassrooms.starterjwt.security.services.UserDetailsImpl;
import com.openclassrooms.starterjwt.security.services.UserDetailsServiceImpl;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthTokenFilterTest {
    JwtUtils jwt;
    UserDetailsServiceImpl users;
    AuthTokenFilter filter;
    FilterChain chain;
    MockHttpServletRequest request;
    MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        jwt = mock(JwtUtils.class);
        users = mock(UserDetailsServiceImpl.class);
        filter = new AuthTokenFilter();
        ReflectionTestUtils.setField(filter, "jwtUtils", jwt);
        ReflectionTestUtils.setField(filter, "userDetailsService", users);
        chain = mock(FilterChain.class);
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
    }

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "Basic abc", "bearer token"})
    void absentAndNonBearerHeadersContinueUnauthenticated(String header) throws Exception {
        if (header != null) {
            request.addHeader("Authorization", header);
        }
        filter.doFilterInternal(request, response, chain);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verifyNoInteractions(jwt, users);
        verify(chain).doFilter(request, response);
    }

    @Test
    void validBearerLoadsPrincipalAndSetsRequestDetails() throws Exception {
        request.addHeader("Authorization", "Bearer valid");
        when(jwt.validateJwtToken("valid")).thenReturn(true);
        when(jwt.getUserNameFromJwtToken("valid")).thenReturn("member@example.com");
        UserDetailsImpl user = UserDetailsImpl.builder().id(1L).username("member@example.com").build();
        when(users.loadUserByUsername("member@example.com")).thenReturn(user);
        filter.doFilterInternal(request, response, chain);
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication.isAuthenticated()).isTrue();
        assertThat(authentication.getPrincipal()).isSameAs(user);
        assertThat(authentication.getDetails()).isNotNull();
        verify(chain).doFilter(request, response);
    }

    @Test
    void invalidTokenDoesNotLoadUser() throws Exception {
        request.addHeader("Authorization", "Bearer invalid");
        filter.doFilterInternal(request, response, chain);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verifyNoInteractions(users);
        verify(chain).doFilter(request, response);
    }

    @Test
    void authenticationFailureStillContinuesChain() throws Exception {
        request.addHeader("Authorization", "Bearer failed");
        when(jwt.validateJwtToken("failed")).thenThrow(new IllegalArgumentException("invalid"));
        filter.doFilterInternal(request, response, chain);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(chain).doFilter(request, response);
    }
}
