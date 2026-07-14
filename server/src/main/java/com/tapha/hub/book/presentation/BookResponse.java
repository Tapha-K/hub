package com.tapha.hub.book.presentation;

import java.time.Instant;

import com.tapha.hub.book.domain.Book;
import com.tapha.hub.book.domain.BookStatus;
import com.tapha.hub.reading.presentation.ReadingRecordSummary;

public record BookResponse(
        Long id,
        String title,
        String author,
        int initialPage,
        BookStatus status,
        int recordCount,
        int nextStartPage,
        ReadingRecordSummary latestRecord,
        Instant createdAt
) {
    public static BookResponse from(Book book) {
        return new BookResponse(
                book.getId(),
                book.getTitle(),
                book.getAuthor(),
                book.getInitialPage(),
                book.getStatus(),
                0,
                book.getInitialPage(),
                null,
                book.getCreatedAt()
        );
    }
}
