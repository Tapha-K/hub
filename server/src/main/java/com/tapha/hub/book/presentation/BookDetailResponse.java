package com.tapha.hub.book.presentation;

import java.time.Instant;
import java.util.List;

import com.tapha.hub.book.domain.Book;
import com.tapha.hub.book.domain.BookStatus;
import com.tapha.hub.reading.presentation.ReadingRecordSummary;

public record BookDetailResponse(
        Long id,
        String title,
        String author,
        int initialPage,
        BookStatus status,
        int nextStartPage,
        ReadingRecordSummary latestRecord,
        List<ReadingRecordSummary> readingRecords,
        Instant createdAt
) {
    public static BookDetailResponse from(Book book) {
        return new BookDetailResponse(
                book.getId(),
                book.getTitle(),
                book.getAuthor(),
                book.getInitialPage(),
                book.getStatus(),
                book.getInitialPage(),
                null,
                List.of(),
                book.getCreatedAt()
        );
    }
}
