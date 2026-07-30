// Regression coverage for QA ISSUE-005: a saved quote must reach the bookshelf without a reload.
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';

import { BookshelfPage } from './BookshelfPage';
import {
  createReadingRecord,
  getBook,
  getBooks,
  getRandomQuote,
} from '@/lib/api';

vi.mock('@/lib/motion', () => ({ prefersReducedMotion: () => true }));
vi.mock('@/lib/api', () => ({
  createBook: vi.fn(),
  createQuoteExposure: vi.fn().mockResolvedValue({ id: 3 }),
  createReadingRecord: vi.fn(),
  deleteReadingRecord: vi.fn(),
  getBook: vi.fn(),
  getBooks: vi.fn(),
  getBookQuotes: vi.fn(),
  getRandomQuote: vi.fn(),
  getReadingActivity: vi.fn().mockResolvedValue({ days: [] }),
  openQuoteExposure: vi.fn(),
  updateBookStatus: vi.fn(),
  updateReadingRecord: vi.fn(),
}));
vi.mock('./AddBookDialog', () => ({ AddBookDialog: () => null }));
vi.mock('./ReadingBookshelf', () => ({
  ReadingBookshelf: ({ books, quote, onSelectBook, onBrowseQuotes, selectedContinueBookId }) => (
    <>
      <button type="button" onClick={() => onSelectBook(books[0].id)}>책 열기</button>
      <button type="button" onClick={onBrowseQuotes}>글귀 모아보기</button>
      {quote && <p>{quote.text}</p>}
      {selectedContinueBookId && <p>이어 읽을 책 {selectedContinueBookId}</p>}
    </>
  ),
}));
vi.mock('./QuoteCollectionDialog', () => ({
  QuoteCollectionDialog: ({ open, onSelectQuote }) => open ? (
    <button
      type="button"
      onClick={() => onSelectQuote({ id: 7, bookId: 2, text: '고른 글귀' })}
    >
      저장한 글귀 선택
    </button>
  ) : null,
}));
vi.mock('./BookDetailScreen', () => ({
  BookDetailScreen: ({ book, onBackToBookshelf, onSaveRecord }) => (
    <button
      type="button"
      onClick={async () => {
        await onSaveRecord(book.id, { endPage: 20, quoteText: '새 글귀' });
        onBackToBookshelf();
      }}
    >
      기록 저장
    </button>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('refreshes the quote after saving a record with a quote', async () => {
  const shelf = { reading: [{ id: 1, status: 'READING' }], completed: [], archived: [] };
  getBooks.mockResolvedValue(shelf);
  getBook.mockResolvedValue(shelf.reading[0]);
  getRandomQuote
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce({ id: 2, bookId: 1, text: '새 글귀' });
  createReadingRecord.mockResolvedValue({});

  render(<BookshelfPage user={{ id: 1, nickname: '독자' }} />);

  fireEvent.click(await screen.findByRole('button', { name: '책 열기' }));
  fireEvent.click(await screen.findByRole('button', { name: '기록 저장' }));

  expect(await screen.findByText('새 글귀')).toBeInTheDocument();
  await waitFor(() => expect(getRandomQuote).toHaveBeenCalledTimes(2));
});

test('저장한 글귀를 고르면 배너와 이어 읽을 책을 함께 바꾼다', async () => {
  getBooks.mockResolvedValue({
    reading: [
      { id: 1, status: 'READING' },
      { id: 2, status: 'READING' },
    ],
    completed: [],
    archived: [],
  });
  getRandomQuote.mockResolvedValue({ id: 3, bookId: 1, text: '처음 글귀' });

  render(<BookshelfPage user={{ id: 1, nickname: '독자' }} />);

  fireEvent.click(await screen.findByRole('button', { name: '글귀 모아보기' }));
  fireEvent.click(screen.getByRole('button', { name: '저장한 글귀 선택' }));

  expect(await screen.findByText('고른 글귀')).toBeInTheDocument();
  expect(screen.getByText('이어 읽을 책 2')).toBeInTheDocument();
});
