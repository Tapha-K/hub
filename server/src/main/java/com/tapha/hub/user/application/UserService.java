package com.tapha.hub.user.application;

import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tapha.hub.user.domain.User;
import com.tapha.hub.user.domain.UserRepository;
import com.tapha.hub.user.presentation.UserResponse;
import com.tapha.hub.auth.application.GoogleIdentity;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public UserResponse login(GoogleIdentity identity) {
        User user = userRepository.findByProviderAndProviderSubject("GOOGLE", identity.subject())
                .orElseGet(() -> userRepository.save(new User(
                        normalizeNickname(identity.name(), identity.email()),
                        "GOOGLE",
                        identity.subject(),
                        identity.email(),
                        Instant.now()
                )));
        user.updateGoogleProfile(normalizeNickname(identity.name(), identity.email()), identity.email());
        return UserResponse.from(user);
    }

    @Transactional(readOnly = true)
    public UserResponse get(Long userId) {
        return userRepository.findById(userId)
                .map(UserResponse::from)
                .orElseThrow();
    }

    private String normalizeNickname(String name, String email) {
        int at = email == null ? -1 : email.indexOf('@');
        String fallback = at > 0 ? email.substring(0, at) : "독자";
        String nickname = name == null || name.isBlank() ? fallback : name.trim();
        return nickname.length() <= 40 ? nickname : nickname.substring(0, 40);
    }
}
