package com.tapha.hub;

import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.tapha.hub.user.domain.User;
import com.tapha.hub.user.domain.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class HubServerApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

	@Test
	void contextLoads() {
	}

    @Test
    void createsUserWithTrimmedNickname() throws Exception {
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "nickname": " 다정 " }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.nickname").value("다정"));
    }

    @Test
    void rejectsBlankNickname() throws Exception {
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "nickname": "   " }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void createsReadingBookWithDefaultInitialPage() throws Exception {
        Long userId = userRepository.save(new User("다정", Instant.now())).getId();

        mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "userId": %d,
                                  "title": " 아주 작은 습관의 힘 ",
                                  "author": "   "
                                }
                                """.formatted(userId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("아주 작은 습관의 힘"))
                .andExpect(jsonPath("$.author").doesNotExist())
                .andExpect(jsonPath("$.initialPage").value(1))
                .andExpect(jsonPath("$.status").value("READING"))
                .andExpect(jsonPath("$.nextStartPage").value(1));
    }

    @Test
    void rejectsUnknownBookOwner() throws Exception {
        mockMvc.perform(post("/api/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "userId": 999999, "title": "독서 기록" }
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

}
