package com.tapha.hub.reading.presentation;

import java.time.Instant;

public record ReadingRecordSummary(
        Long id,
        int startPage,
        int endPage,
        String impression,
        Instant createdAt
) {
}
