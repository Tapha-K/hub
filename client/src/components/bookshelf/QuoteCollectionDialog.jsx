import { useEffect, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getBookQuotes } from '@/lib/api';

export function QuoteCollectionDialog({ open, onOpenChange, books, selectedQuoteId, onSelectQuote }) {
  const [quotes, setQuotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return undefined;

    let isCancelled = false;
    setIsLoading(true);
    setError('');

    // ponytail: one request per reading book; add a collection endpoint if shelf size makes this slow.
    Promise.all(books.map(async (book) => {
      const bookQuotes = await getBookQuotes(book.id);
      return bookQuotes.map((quote) => ({ ...quote, book }));
    }))
      .then((quotesByBook) => {
        if (!isCancelled) setQuotes(quotesByBook.flat());
      })
      .catch((requestError) => {
        if (!isCancelled) setError(requestError.message);
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [books, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="record-dialog quote-collection-dialog">
        <DialogHeader className="record-dialog__header">
          <p className="section-kicker">SAVED LINES</p>
          <DialogTitle>다시 읽고 싶은 글귀</DialogTitle>
          <DialogDescription>
            글귀를 고르면 상단 문장과 이어 읽을 책이 함께 바뀌어요.
          </DialogDescription>
        </DialogHeader>

        <div className="quote-collection-dialog__body">
          {isLoading ? (
            <p className="quote-collection-dialog__status">글귀를 모으고 있어요.</p>
          ) : error ? (
            <p className="field-error" role="alert">{error}</p>
          ) : quotes.length ? (
            <ul className="quote-collection">
              {quotes.map((quote) => (
                <li key={quote.id}>
                  <button
                    type="button"
                    aria-pressed={selectedQuoteId === quote.id}
                    onClick={() => {
                      onSelectQuote(quote);
                      onOpenChange(false);
                    }}
                  >
                    <blockquote>“{quote.text}”</blockquote>
                    <span>
                      {quote.book.title}
                      {selectedQuoteId === quote.id && <small>현재 선택</small>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="quote-collection-dialog__status">
              읽는 중인 책에서 남긴 글귀가 아직 없어요.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
