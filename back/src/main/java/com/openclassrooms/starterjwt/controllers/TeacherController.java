package com.openclassrooms.starterjwt.controllers;

import com.openclassrooms.starterjwt.mapper.TeacherMapper;
import com.openclassrooms.starterjwt.models.Teacher;
import com.openclassrooms.starterjwt.services.TeacherService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/teacher")
public class TeacherController {
    private final TeacherMapper teacherMapper;
    private final TeacherService teacherService;

    public TeacherController(TeacherService teacherService, TeacherMapper teacherMapper) {
        this.teacherMapper = teacherMapper;
        this.teacherService = teacherService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> findById(@PathVariable("id") Long id) {
        Teacher teacher = teacherService.findById(id);
        return teacher == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(teacherMapper.toDto(teacher));
    }

    @GetMapping
    public ResponseEntity<?> findAll() {
        return ResponseEntity.ok(teacherMapper.toDto(teacherService.findAll()));
    }
}
