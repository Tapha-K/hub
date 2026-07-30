import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';

import { QuoteCollectionDialog } from './QuoteCollectionDialog';
import { getBookQuotes } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  getBookQuotes: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('출처 책과 글귀를 모아 보여주고 선택한 글귀를 전달한다', async () => {
  const onSelectQuote = vi.fn();
  const onOpenChange = vi.fn();
  const books = [
    { id: 1, title: '데미안' },
    { id: 2, title: '싯다르타' },
  ];
  getBookQuotes
    .mockResolvedValueOnce([{ id: 11, bookId: 1, text: '새는 알에서 나오려고 투쟁한다.' }])
    .mockResolvedValueOnce([{ id: 12, bookId: 2, text: '지혜는 전달할 수 없다.' }]);

  render(
    <QuoteCollectionDialog
      open
      onOpenChange={onOpenChange}
      books={books}
      selectedQuoteId={null}
      onSelectQuote={onSelectQuote}
    />,
  );

  expect(await screen.findByText('데미안')).toBeInTheDocument();
  expect(screen.getByText('싯다르타')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /지혜는 전달할 수 없다/ }));

  expect(onSelectQuote).toHaveBeenCalledWith(expect.objectContaining({
    id: 12,
    bookId: 2,
    book: books[1],
  }));
  expect(onOpenChange).toHaveBeenCalledWith(false);
});
