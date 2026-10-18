package com.openclassrooms.starterjwt;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.openclassrooms.starterjwt.dto.SessionDto;
import com.openclassrooms.starterjwt.models.Session;
import com.openclassrooms.starterjwt.models.Teacher;
import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.repository.SessionRepository;
import com.openclassrooms.starterjwt.repository.TeacherRepository;
import com.openclassrooms.starterjwt.repository.UserRepository;
import com.openclassrooms.starterjwt.security.jwt.JwtUtils;
import com.openclassrooms.starterjwt.security.services.UserDetailsImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ApiIT {
    @Autowired MockMvc mvc;
    @Autowired TestRestTemplate http;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired TeacherRepository teachers;
    @Autowired SessionRepository sessions;
    @Autowired PasswordEncoder encoder;
    @Autowired JwtUtils jwt;
    User member;
    User admin;
    Teacher teacher;
    Session session;
    String token;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        String password = encoder.encode("secret123");
        member = users.save(new User("member@example.com", "Member", "Yoga", password, false));
        admin = users.save(new User("admin@example.com", "Admin", "Yoga", password, true));
        teacher = teachers.save(Teacher.builder().firstName("Jane").lastName("Teacher").build());
        session = sessions.save(Session.builder().name("Morning yoga").description("Relax and stretch")
                .date(new Date(1800000000000L)).teacher(teacher).users(new ArrayList<>()).build());
        token = token(member);
    }

    private String token(User user) {
        UserDetailsImpl principal = UserDetailsImpl.builder().id(user.getId()).username(user.getEmail())
                .firstName(user.getFirstName()).lastName(user.getLastName())
                .password(user.getPassword()).admin(user.isAdmin()).build();
        return jwt.generateJwtToken(new UsernamePasswordAuthenticationToken(principal, null, List.of()));
    }

    private MockHttpServletRequestBuilder authorized(MockHttpServletRequestBuilder request) {
        return request.header("Authorization", "Bearer " + token);
    }

    private SessionDto dto() {
        return new SessionDto(null, "Evening yoga", new Date(1800000000000L), teacher.getId(),
                "Breathe deeply", List.of(), null, null);
    }

    @Test
    void applicationServesRealHttpRequestsAndRejectsAnonymousClients() {
        assertThat(http.getForEntity("/api/session", String.class).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @ParameterizedTest
    @ValueSource(strings = {"/api/session", "/api/teacher", "/api/user/1", "/other"})
    void protectedEndpointsRequireAuthentication(String path) throws Exception {
        mvc.perform(get(path)).andExpect(status().isUnauthorized());
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "Basic abc", "Bearer broken", "Bearer "})
    void invalidAuthorizationCannotAccessProtectedEndpoints(String authorization) throws Exception {
        mvc.perform(get("/api/session").header("Authorization", authorization)).andExpect(status().isUnauthorized());
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void loginReturnsActualAccountAndSignedJwt(boolean isAdmin) throws Exception {
        User account = isAdmin ? admin : member;
        String response = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(java.util.Map.of("email", account.getEmail(), "password", "secret123"))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.type").value("Bearer"))
                .andExpect(jsonPath("$.id").value(account.getId().intValue()))
                .andExpect(jsonPath("$.username").value(account.getEmail()))
                .andExpect(jsonPath("$.firstName").value("Yoga"))
                .andExpect(jsonPath("$.lastName").value(account.getLastName()))
                .andExpect(jsonPath("$.admin").value(isAdmin))
                .andExpect(jsonPath("$.password").doesNotExist()).andReturn().getResponse().getContentAsString();
        String accessToken = json.readTree(response).get("token").asText();
        assertThat(jwt.validateJwtToken(accessToken)).isTrue();
        mvc.perform(get("/api/teacher").header("Authorization", "Bearer " + accessToken)).andExpect(status().isOk());
    }

    @ParameterizedTest
    @CsvSource({"member@example.com,incorrect", "unknown@example.com,secret123"})
    void badCredentialsReturnUnauthorized(String email, String password) throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(java.util.Map.of("email", email, "password", password))))
                .andExpect(status().isUnauthorized());
    }

    @ParameterizedTest
    @ValueSource(strings = {"{}", "{\"email\":\"member@example.com\"}", "{\"password\":\"secret123\"}",
            "{\"email\":\" \",\"password\":\" \"}"})
    void loginValidatesRequiredFields(String body) throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registrationEncodesPasswordAndDoesNotGrantAdmin() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"new@example.com","firstName":"New","lastName":"Member",
                                 "password":"secret123","admin":true}
                                """))
                .andExpect(status().isOk()).andExpect(jsonPath("$.message").value("User registered successfully!"));
        User result = users.findByEmail("new@example.com").orElseThrow();
        assertThat(result.isAdmin()).isFalse();
        assertThat(result.getPassword()).isNotEqualTo("secret123");
        assertThat(encoder.matches("secret123", result.getPassword())).isTrue();
    }

    @Test
    void duplicateRegistrationPreservesExistingAccount() throws Exception {
        long before = users.count();
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"member@example.com","firstName":"New","lastName":"Member","password":"secret123"}
                                """))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("Error: Email is already taken!"));
        assertThat(users.count()).isEqualTo(before);
    }

    @ParameterizedTest
    @ValueSource(strings = {"{}", "{\"email\":\"invalid\",\"firstName\":\"New\",\"lastName\":\"Member\",\"password\":\"secret123\"}",
            "{\"email\":\"new@example.com\",\"lastName\":\"Member\",\"password\":\"secret123\"}",
            "{\"email\":\"new@example.com\",\"firstName\":\"New\",\"password\":\"secret123\"}",
            "{\"email\":\"new@example.com\",\"firstName\":\"New\",\"lastName\":\"Member\"}",
            "{\"email\":\"new@example.com\",\"firstName\":\"N\",\"lastName\":\"Member\",\"password\":\"tiny\"}"})
    void registrationValidatesRequiredAndConstrainedFields(String body) throws Exception {
        long before = users.count();
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
        assertThat(users.count()).isEqualTo(before);
    }

    @Test
    void listsAndDetailsExposeCorrectFieldsWithoutPassword() throws Exception {
        mvc.perform(authorized(get("/api/session"))).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Morning yoga"))
                .andExpect(jsonPath("$[0].teacher_id").value(teacher.getId().intValue()));
        mvc.perform(authorized(get("/api/session/{id}", session.getId()))).andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Relax and stretch"))
                .andExpect(jsonPath("$.users").isEmpty()).andExpect(jsonPath("$.createdAt").isNotEmpty());
        mvc.perform(authorized(get("/api/teacher"))).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].firstName").value("Jane"));
        mvc.perform(authorized(get("/api/teacher/{id}", teacher.getId()))).andExpect(status().isOk())
                .andExpect(jsonPath("$.lastName").value("Teacher"));
        mvc.perform(authorized(get("/api/user/{id}", member.getId()))).andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("member@example.com"))
                .andExpect(jsonPath("$.admin").value(false)).andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void emptyListsAreSuccessful() throws Exception {
        sessions.deleteAll();
        teachers.deleteAll();
        mvc.perform(authorized(get("/api/session"))).andExpect(status().isOk()).andExpect(content().json("[]"));
        mvc.perform(authorized(get("/api/teacher"))).andExpect(status().isOk()).andExpect(content().json("[]"));
    }

    @Test
    void createAndUpdatePersistAndAllowMultipleSessionsForOneTeacher() throws Exception {
        SessionDto body = dto();
        String response = mvc.perform(post("/api/session").header("Authorization", "Bearer " + token(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Evening yoga"))
                .andReturn().getResponse().getContentAsString();
        long id = json.readTree(response).get("id").asLong();
        sessions.flush();
        assertThat(sessions.count()).isEqualTo(2);
        assertThat(sessions.findById(id).orElseThrow().getTeacher().getId()).isEqualTo(teacher.getId());
        body.setId(999999L);
        body.setName("Updated yoga");
        mvc.perform(put("/api/session/{id}", id).header("Authorization", "Bearer " + token(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.id").value((int) id))
                .andExpect(jsonPath("$.name").value("Updated yoga"));
        assertThat(sessions.findById(id).orElseThrow().getName()).isEqualTo("Updated yoga");
    }

    @ParameterizedTest
    @CsvSource({"POST,name", "POST,date", "POST,teacher_id", "POST,description",
            "PUT,name", "PUT,date", "PUT,teacher_id", "PUT,description"})
    void sessionWritesValidateEveryRequiredField(String method, String field) throws Exception {
        var body = json.valueToTree(dto());
        ((com.fasterxml.jackson.databind.node.ObjectNode) body).remove(field);
        String path = method.equals("POST") ? "/api/session" : "/api/session/" + session.getId();
        mvc.perform(authorized(request(HttpMethod.valueOf(method), path)).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(body))).andExpect(status().isBadRequest());
        assertThat(sessions.count()).isEqualTo(1);
    }

    @Test
    void deletionRemovesSession() throws Exception {
        mvc.perform(delete("/api/session/{id}", session.getId()).header("Authorization", "Bearer " + token(admin)))
                .andExpect(status().isOk());
        assertThat(sessions.findById(session.getId())).isEmpty();
    }

    @Test
    void participationAndWithdrawalPersistAndRejectRepeatedRequests() throws Exception {
        String path = "/api/session/" + session.getId() + "/participate/" + member.getId();
        mvc.perform(authorized(post(path))).andExpect(status().isOk());
        assertThat(sessions.findById(session.getId()).orElseThrow().getUsers()).containsExactly(member);
        mvc.perform(authorized(post(path))).andExpect(status().isBadRequest());
        mvc.perform(authorized(delete(path))).andExpect(status().isOk());
        assertThat(sessions.findById(session.getId()).orElseThrow().getUsers()).isEmpty();
        mvc.perform(authorized(delete(path))).andExpect(status().isBadRequest());
    }

    @ParameterizedTest
    @CsvSource({"GET,/api/session/999999", "DELETE,/api/session/999999", "GET,/api/teacher/999999",
            "GET,/api/user/999999", "DELETE,/api/user/999999",
            "POST,/api/session/999999/participate/999999", "DELETE,/api/session/999999/participate/999999"})
    void missingResourcesReturnNotFound(String method, String path) throws Exception {
        mvc.perform(authorized(request(HttpMethod.valueOf(method), path))).andExpect(status().isNotFound());
    }

    @Test
    void participationRejectsUnknownUser() throws Exception {
        mvc.perform(authorized(post("/api/session/{id}/participate/999999", session.getId())))
                .andExpect(status().isNotFound());
    }

    @ParameterizedTest
    @CsvSource({"GET,/api/session/abc", "DELETE,/api/session/abc", "PUT,/api/session/abc",
            "GET,/api/teacher/abc", "GET,/api/user/abc", "DELETE,/api/user/abc",
            "POST,/api/session/abc/participate/1", "POST,/api/session/1/participate/abc",
            "DELETE,/api/session/abc/participate/1", "DELETE,/api/session/1/participate/abc",
            "GET,/api/session/9999999999999999999999999"})
    void invalidIdentifiersAreHandledCentrally(String method, String path) throws Exception {
        mvc.perform(authorized(request(HttpMethod.valueOf(method), path)).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(dto()))).andExpect(status().isBadRequest());
    }

    @Test
    void onlyOwnerCanDeleteAccountAndDeletedTokensStopWorking() throws Exception {
        mvc.perform(authorized(delete("/api/user/{id}", admin.getId()))).andExpect(status().isUnauthorized());
        assertThat(users.existsById(admin.getId())).isTrue();
        mvc.perform(authorized(delete("/api/user/{id}", member.getId()))).andExpect(status().isOk());
        assertThat(users.existsById(member.getId())).isFalse();
        mvc.perform(authorized(get("/api/session"))).andExpect(status().isUnauthorized());
    }
}
