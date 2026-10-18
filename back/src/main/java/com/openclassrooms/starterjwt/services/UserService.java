package com.openclassrooms.starterjwt.services;

import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.repository.UserRepository;
import com.openclassrooms.starterjwt.exception.NotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void delete(Long id) {
        this.userRepository.deleteById(id);
    }

    public User findById(Long id) {
        return this.userRepository.findById(id).orElse(null);
    }

    public void deleteOwnAccount(Long id, String username) {
        User user = findById(id);
        if (user == null) {
            throw new NotFoundException();
        }
        if (!user.getEmail().equals(username)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        delete(id);
    }
}
