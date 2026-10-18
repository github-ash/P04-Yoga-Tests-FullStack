package com.openclassrooms.starterjwt.security.jwt;

import com.openclassrooms.starterjwt.security.services.UserDetailsImpl;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Date;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

class JwtUtilsTest {
    static final String SECRET = Base64.getEncoder().encodeToString(
            "test-only-signing-key-with-more-than-sixty-four-bytes-not-for-production-12345".getBytes(StandardCharsets.UTF_8));
    JwtUtils utils;

    @BeforeEach
    void setUp() {
        utils = new JwtUtils();
        ReflectionTestUtils.setField(utils, "jwtSecret", SECRET);
        ReflectionTestUtils.setField(utils, "jwtExpirationMs", 60000);
    }

    @Test
    void signedTokenContainsUsernameAndExpiration() {
        var authentication = new UsernamePasswordAuthenticationToken(
                UserDetailsImpl.builder().username("member@example.com").build(), null, List.of());
        String token = utils.generateJwtToken(authentication);
        assertThat(utils.validateJwtToken(token)).isTrue();
        assertThat(utils.getUserNameFromJwtToken(token)).isEqualTo("member@example.com");
        var claims = Jwts.parser().setSigningKey(SECRET).build().parseClaimsJws(token).getBody();
        assertThat(claims.getExpiration()).isAfter(claims.getIssuedAt());
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "not.a.jwt", "broken"})
    void emptyAndMalformedTokensAreRejected(String token) {
        assertThat(utils.validateJwtToken(token)).isFalse();
    }

    @Test
    void expiredTokenIsRejected() {
        String token = Jwts.builder().setSubject("member@example.com").setExpiration(new Date(0))
                .signWith(SignatureAlgorithm.HS512, SECRET).compact();
        assertThat(utils.validateJwtToken(token)).isFalse();
    }

    @Test
    void wrongSignatureIsRejected() {
        String otherSecret = Base64.getEncoder().encodeToString("x".repeat(80).getBytes(StandardCharsets.UTF_8));
        String token = Jwts.builder().setSubject("member@example.com")
                .signWith(SignatureAlgorithm.HS512, otherSecret).compact();
        assertThat(utils.validateJwtToken(token)).isFalse();
    }

    @Test
    void unsignedTokenIsRejected() {
        assertThat(utils.validateJwtToken(Jwts.builder().setSubject("member@example.com").compact())).isFalse();
    }
}
