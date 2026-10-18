package com.openclassrooms.starterjwt.controllers;

import com.openclassrooms.starterjwt.dto.SessionDto;
import com.openclassrooms.starterjwt.mapper.SessionMapper;
import com.openclassrooms.starterjwt.models.Session;
import com.openclassrooms.starterjwt.services.SessionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/session")
public class SessionController {
    private final SessionMapper sessionMapper;
    private final SessionService sessionService;

    public SessionController(SessionService sessionService, SessionMapper sessionMapper) {
        this.sessionMapper = sessionMapper;
        this.sessionService = sessionService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> findById(@PathVariable("id") Long id) {
        Session session = sessionService.getById(id);
        return session == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(sessionMapper.toDto(session));
    }

    @GetMapping
    public ResponseEntity<?> findAll() {
        return ResponseEntity.ok(sessionMapper.toDto(sessionService.findAll()));
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody SessionDto dto) {
        return ResponseEntity.ok(sessionMapper.toDto(sessionService.create(sessionMapper.toEntity(dto))));
    }

    @PutMapping("{id}")
    public ResponseEntity<?> update(@PathVariable("id") Long id, @Valid @RequestBody SessionDto dto) {
        return ResponseEntity.ok(sessionMapper.toDto(sessionService.update(id, sessionMapper.toEntity(dto))));
    }

    @DeleteMapping("{id}")
    public ResponseEntity<?> save(@PathVariable("id") Long id) {
        if (sessionService.getById(id) == null) {
            return ResponseEntity.notFound().build();
        }
        sessionService.delete(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("{id}/participate/{userId}")
    public ResponseEntity<?> participate(@PathVariable("id") Long id, @PathVariable("userId") Long userId) {
        sessionService.participate(id, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("{id}/participate/{userId}")
    public ResponseEntity<?> noLongerParticipate(@PathVariable("id") Long id, @PathVariable("userId") Long userId) {
        sessionService.noLongerParticipate(id, userId);
        return ResponseEntity.ok().build();
    }
}
