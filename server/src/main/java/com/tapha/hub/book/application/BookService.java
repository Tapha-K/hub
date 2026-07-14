package com.tapha.hub.book.application;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tapha.hub.book.domain.Book;
import com.tapha.hub.book.domain.BookRepository;
import com.tapha.hub.book.domain.BookStatus;
import com.tapha.hub.book.presentation.BookResponse;
import com.tapha.hub.book.presentation.BookshelfResponse;
import com.tapha.hub.book.presentation.CreateBookRequest;
import com.tapha.hub.common.application.ResourceNotFoundException;
import com.tapha.hub.user.domain.UserRepository;

@Service
public class BookService {

    private final BookRepository bookRepository;
    private final UserRepository userRepository;

    public BookService(BookRepository bookRepository, UserRepository userRepository) {
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public BookResponse create(CreateBookRequest request) {
        if (!userRepository.existsById(request.userId())) {
            throw new ResourceNotFoundException("사용자를 찾을 수 없어요.");
        }

        Book book = new Book(
                request.userId(),
                request.title().trim(),
                normalizeAuthor(request.author()),
                request.initialPage() == null ? 1 : request.initialPage(),
                Instant.now()
        );

        return BookResponse.from(bookRepository.save(book));
    }

    @Transactional(readOnly = true)
    public BookshelfResponse getBooks(Long userId, BookStatus status) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("사용자를 찾을 수 없어요.");
        }

        List<BookResponse> books = bookRepository
                .findByUserIdAndStatusOrderByCreatedAtDescIdDesc(userId, status)
                .stream()
                .map(BookResponse::from)
                .toList();

        return new BookshelfResponse(books);
    }

    private String normalizeAuthor(String author) {
        if (author == null || author.isBlank()) {
            return null;
        }
        return author.trim();
    }
}
