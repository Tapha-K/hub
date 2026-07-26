import { useEffect, useId, useRef, useState } from 'react';
import { Archive, ArrowLeft, ArrowRight, BookOpen, Check, Plus, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AddBookDialog } from '@/components/bookshelf/AddBookDialog';
import { ReadingBookshelf } from '@/components/bookshelf/ReadingBookshelf';
import { ReadingRecordList } from '@/components/bookshelf/ReadingRecordList';
import { SessionRecordDialog } from '@/components/bookshelf/SessionRecordDialog';
import { TimerPanel } from '@/components/bookshelf/TimerPanel';
import { OnboardingPage } from '@/components/onboarding/OnboardingPage';
import {
  getLatestRecord,
  getNextStartPage,
  getRecords,
} from '@/lib/reading';
import { prefersReducedMotion } from '@/lib/motion';
import {
  createBook,
  createQuoteExposure,
  createReadingRecord,
  deleteReadingRecord,
  getBook,
  getBooks,
  getRandomQuote,
  getSession,
  openQuoteExposure,
  updateBookStatus,
  updateReadingRecord,
} from '@/lib/api';

function EmptyBookshelf({ user, onAddBook }) {
  return (
    <main className="bookshelf-preview">
      <header className="bookshelf-preview__header">
        <a href="/bookshelf" aria-label="잇장 홈">
          <BookOpen aria-hidden="true" size={19} strokeWidth={1.8} />
          <span>잇장</span>
        </a>
        <span>{user.nickname}의 잇장</span>
      </header>

      <section className="empty-bookshelf" aria-labelledby="empty-shelf-title">
        <p className="section-kicker">MY SHELF</p>
        <h1 id="empty-shelf-title">첫 책이 들어올 자리예요.</h1>
        <p>
          지금 읽고 있는 책을 등록하면, 다음부터 마지막 책갈피에서 바로 이어 읽을 수
          있어요.
        </p>
        <Button className="empty-bookshelf__cta" size="lg" type="button" onClick={onAddBook}>
          <Plus aria-hidden="true" size={18} strokeWidth={1.8} />
          읽고 있는 책 추가
        </Button>
      </section>

      <div className="empty-bookshelf__wood" aria-hidden="true">
        <span />
      </div>
    </main>
  );
}

function DeleteRecordDialog({ record, open, onOpenChange, onConfirm }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setIsDeleting(false);
      setError('');
    }
  }, [open]);

  async function handleConfirm() {
    setIsDeleting(true);
    setError('');
    try {
      await onConfirm();
    } catch (requestError) {
      setError(requestError.message);
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="record-dialog record-delete-dialog" showCloseButton={false}>
        <DialogHeader className="record-dialog__header">
          <p className="section-kicker">DELETE A RECORD</p>
          <DialogTitle>이 기록을 지울까요?</DialogTitle>
          <DialogDescription>
            {record ? `${record.startPage}–${record.endPage}쪽 기록을 지우면 다음 책갈피가 다시 계산돼요.` : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="record-dialog__form">
          {error && <p className="field-error" role="alert">{error}</p>}
          <div className="record-dialog__actions">
            <Button type="button" variant="outline" disabled={isDeleting} onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="button" variant="destructive" disabled={isDeleting} onClick={handleConfirm}>
              {isDeleting ? '기록을 지우는 중이에요…' : '기록 삭제'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BookStatusDialog({ book, mode, open, onOpenChange, onConfirm }) {
  const reviewId = useId();
  const [review, setReview] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const isComplete = mode === 'complete';
  const isArchive = mode === 'archive';

  useEffect(() => {
    if (open) {
      setReview(book?.finalReview ?? '');
      setIsSaving(false);
      setError('');
    }
  }, [book, open]);

  async function handleConfirm() {
    setIsSaving(true);
    setError('');
    try {
      await onConfirm({
        status: isComplete ? 'COMPLETED' : isArchive ? 'ARCHIVED' : 'READING',
        finalReview: isComplete ? review : '',
      });
      onOpenChange(false);
    } catch (requestError) {
      setError(requestError.message);
      setIsSaving(false);
    }
  }

  const title = isComplete ? '이 책을 완독으로 옮길까요?' : isArchive ? '책을 잠시 보관할까요?' : '다시 읽는 중으로 옮길까요?';
  const description = isComplete
    ? '완독한 책은 완독 선반에 놓이고, 긴 서평은 지금 쓰지 않아도 괜찮아요.'
    : isArchive
      ? '기록과 마지막 책갈피는 그대로 남아요. 언제든 다시 꺼낼 수 있어요.'
      : book?.status === 'COMPLETED'
        ? '완독 서평과 마지막 책갈피를 유지한 채 읽고 있는 책장으로 돌아가요.'
        : '마지막 책갈피를 유지한 채 읽고 있는 책장으로 돌아가요.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="status-dialog" showCloseButton={false}>
        <DialogHeader className="status-dialog__header">
          <p className="section-kicker">{isComplete ? 'FINISH THE BOOK' : isArchive ? 'PUT ASIDE' : 'BRING IT BACK'}</p>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="status-dialog__form">
          {isComplete && (
            <div className="field-group">
              <Label htmlFor={reviewId}>완독 서평 <span>선택</span></Label>
              <textarea
                id={reviewId}
                value={review}
                onChange={(event) => setReview(event.target.value)}
                placeholder="한 권을 다 읽은 뒤의 생각을 남겨 보세요. 나중에 써도 괜찮아요."
                rows={5}
                maxLength={10000}
              />
              <p className="field-help">세션 감상과 달리, 책 전체를 돌아보는 긴 글이에요.</p>
            </div>
          )}
          {error && <p className="field-error" role="alert">{error}</p>}
          <div className="status-dialog__actions">
            <Button type="button" variant="outline" disabled={isSaving} onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="button" disabled={isSaving} onClick={handleConfirm}>
              {isSaving ? '저장 중이에요…' : isComplete ? '완독으로 옮기기' : isArchive ? '보관하기' : '다시 읽는 중으로'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BookDetailScreen({
  book,
  userId,
  quoteExposureId,
  startInReadingContext,
  onBackToBookshelf,
  onSaveRecord,
  onUpdateRecord,
  onDeleteRecord,
  onUpdateStatus,
}) {
  const [isReadingContextActive, setIsReadingContextActive] = useState(startInReadingContext);
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [statusMode, setStatusMode] = useState(null);
  const [pendingDurationSeconds, setPendingDurationSeconds] = useState(null);
  const records = getRecords(book);
  const latestRecord = getLatestRecord(book);
  const nextStartPage = getNextStartPage(book);

  return (
    <main className="book-detail">
      <header className="book-detail__header">
        <a href="/bookshelf" aria-label="잇장 홈">
          <BookOpen aria-hidden="true" size={19} strokeWidth={1.8} />
          <span>잇장</span>
        </a>
        <Button type="button" variant="ghost" onClick={onBackToBookshelf}>
          <ArrowLeft aria-hidden="true" size={17} strokeWidth={1.8} />
          책장으로 돌아가기
        </Button>
      </header>

      <article className="reading-note" aria-labelledby="book-detail-title">
        <div className="reading-note__book-object" aria-hidden="true">
          <div className="reading-note__book-cover">
            <BookOpen size={27} strokeWidth={1.35} />
            <span>READING NOTE</span>
          </div>
          <div className="reading-note__book-pages">
            <span />
            <span />
            <span />
          </div>
        </div>
        <p className="section-kicker">READING NOTE</p>
        <h1 id="book-detail-title">{book.title}</h1>
        {book.author && <p className="reading-note__author">{book.author}</p>}

        <section className="bookmark-summary" aria-labelledby="bookmark-summary-title">
          <p className="bookmark-summary__label" id="bookmark-summary-title">다음 책갈피</p>
          <p className="bookmark-summary__page">
            {latestRecord ? `지난번 ${latestRecord.endPage}쪽까지 읽었어요.` : `${book.initialPage}쪽부터 시작해 볼까요?`}
          </p>
          <p>다음에는 {nextStartPage}쪽부터 이어 읽을 수 있어요.</p>
        </section>

        <section className={`book-status book-status--${book.status.toLowerCase()}`} aria-label="책 상태">
          <div>
            <p className="section-kicker">BOOK STATUS</p>
            <strong>{book.status === 'COMPLETED' ? '완독한 책' : book.status === 'ARCHIVED' ? '잠시 보관한 책' : '읽는 중인 책'}</strong>
          </div>
          {book.status === 'READING' ? (
            <div className="book-status__actions">
              <Button type="button" variant="outline" onClick={() => setStatusMode('archive')}>
                <Archive aria-hidden="true" size={16} strokeWidth={1.8} />
                잠시 보관하기
              </Button>
              <Button type="button" variant="outline" onClick={() => setStatusMode('complete')}>
                <Check aria-hidden="true" size={16} strokeWidth={1.8} />
                완독으로 옮기기
              </Button>
            </div>
          ) : (
            <Button type="button" variant="outline" onClick={() => setStatusMode('resume')}>
              <RotateCcw aria-hidden="true" size={16} strokeWidth={1.8} />
              다시 읽는 중으로
            </Button>
          )}
        </section>

        {book.status === 'COMPLETED' && (
          <section className="final-review-page" aria-labelledby="final-review-title">
            <p className="section-kicker">FINAL REVIEW</p>
            <h2 id="final-review-title">한 권의 마지막 장</h2>
            <p>{book.finalReview || '완독 서평은 아직 남기지 않았어요. 나중에 천천히 돌아와도 괜찮아요.'}</p>
          </section>
        )}

        {book.status === 'READING' && (
          <section className="start-reading-panel" aria-labelledby="start-reading-title">
            <p className="section-kicker">NEXT READING</p>
            <h2 id="start-reading-title">{nextStartPage}쪽부터 이어 읽어볼까요?</h2>
            {isReadingContextActive ? (
              <>
                <p>다 읽고 돌아오면 기록을 남겨 주세요. 타이머 없이도 기록할 수 있어요.</p>
                <TimerPanel
                  userId={userId}
                  bookId={book.id}
                  onEndSession={(durationSeconds) => {
                    setPendingDurationSeconds(durationSeconds);
                    setIsRecordDialogOpen(true);
                  }}
                />
                <Button type="button" onClick={() => setIsRecordDialogOpen(true)}>이번 읽기 기록 남기기</Button>
              </>
            ) : (
              <Button type="button" onClick={() => setIsReadingContextActive(true)}>
                {nextStartPage}쪽부터 이어 읽기
                <ArrowRight aria-hidden="true" size={17} strokeWidth={1.8} />
              </Button>
            )}
          </section>
        )}

        <ReadingRecordList
          records={records}
          latestRecord={latestRecord}
          onEditRecord={(record) => setEditingRecord({
            record,
            canEditPage: record.id === latestRecord?.id,
          })}
          onDeleteRecord={setDeletingRecord}
        />
      </article>
      <SessionRecordDialog
        book={book}
        record={editingRecord?.record}
        canEditPage={editingRecord?.canEditPage ?? true}
        open={isRecordDialogOpen || Boolean(editingRecord)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setIsRecordDialogOpen(false);
            setEditingRecord(null);
            setPendingDurationSeconds(null);
          }
        }}
        onSave={async (record) => {
          if (editingRecord) {
            await onUpdateRecord(book.id, editingRecord.record.id, record);
          } else {
            await onSaveRecord(book.id, {
              ...record,
              readingDurationSeconds: pendingDurationSeconds,
              quoteExposureId,
            });
            setPendingDurationSeconds(null);
            setIsReadingContextActive(false);
          }
        }}
      />
      <DeleteRecordDialog
        record={deletingRecord}
        open={Boolean(deletingRecord)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDeletingRecord(null);
        }}
        onConfirm={async () => {
          await onDeleteRecord(book.id, deletingRecord.id);
          setDeletingRecord(null);
        }}
      />
      <BookStatusDialog
        book={book}
        mode={statusMode}
        open={Boolean(statusMode)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setStatusMode(null);
        }}
        onConfirm={async (statusInput) => {
          await onUpdateStatus(book.id, statusInput);
          if (statusInput.status === 'ARCHIVED') onBackToBookshelf();
        }}
      />
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [books, setBooks] = useState([]);
  const [completedBooks, setCompletedBooks] = useState([]);
  const [archivedBooks, setArchivedBooks] = useState([]);
  const [isBooksLoading, setIsBooksLoading] = useState(false);
  const [booksError, setBooksError] = useState('');
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [openingBookId, setOpeningBookId] = useState(null);
  const [bookOpeningPhase, setBookOpeningPhase] = useState(null);
  const [openingPageCount, setOpeningPageCount] = useState(0);
  const openingTimerRef = useRef(null);
  const [bookDetail, setBookDetail] = useState(null);
  const [isBookDetailLoading, setIsBookDetailLoading] = useState(false);
  const [bookDetailError, setBookDetailError] = useState('');
  const [shouldStartReading, setShouldStartReading] = useState(false);
  const [quote, setQuote] = useState(null);
  const [quoteExposure, setQuoteExposure] = useState(null);
  const [activeQuoteExposureId, setActiveQuoteExposureId] = useState(null);

  useEffect(() => {
    let isCancelled = false;
    getSession()
      .then((sessionUser) => {
        if (!isCancelled) setUser(sessionUser);
      })
      .catch(() => {})
      .finally(() => {
        if (!isCancelled) setIsAuthLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (user && window.location.pathname === '/') {
      window.history.replaceState({}, '', '/bookshelf');
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (openingTimerRef.current) window.clearTimeout(openingTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!selectedBookId || !user) return undefined;

    let isCancelled = false;
    setIsBookDetailLoading(true);
    setBookDetailError('');
    setBookDetail(null);

    getBook(selectedBookId)
      .then((detail) => {
        if (!isCancelled) setBookDetail(detail);
      })
      .catch((requestError) => {
        if (!isCancelled) setBookDetailError(requestError.message);
      })
      .finally(() => {
        if (!isCancelled) setIsBookDetailLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedBookId, user]);

  useEffect(() => {
    if (!user) return undefined;

    let isCancelled = false;
    setIsBooksLoading(true);
    setBooksError('');

    getBooks()
      .then((shelf) => {
        if (!isCancelled) {
          setBooks(shelf.reading);
          setCompletedBooks(shelf.completed);
          setArchivedBooks(shelf.archived);
        }
      })
      .catch((requestError) => {
        if (!isCancelled) setBooksError(requestError.message);
      })
      .finally(() => {
        if (!isCancelled) setIsBooksLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    let isCancelled = false;
    getRandomQuote()
      .then((nextQuote) => {
        if (!isCancelled) setQuote(nextQuote);
      })
      .catch(() => {});
    return () => {
      isCancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!quote || selectedBookId || isBooksLoading || !books.some((book) => book.id === quote.bookId)) {
      setQuoteExposure(null);
      return undefined;
    }
    let isCancelled = false;
    createQuoteExposure(quote.id)
      .then((exposure) => {
        if (!isCancelled) setQuoteExposure(exposure);
      })
      .catch(() => {});
    return () => {
      isCancelled = true;
    };
  }, [quote, selectedBookId, isBooksLoading, books]);

  function handleOnboardingComplete(newUser) {
    window.history.pushState({}, '', '/bookshelf');
    setUser(newUser);
  }

  function openBook(bookId, startInReadingContext = false, bookOverride = null) {
    if (openingTimerRef.current) {
      window.clearTimeout(openingTimerRef.current);
      openingTimerRef.current = null;
    }

    const openingBook = bookOverride ?? [...books, ...completedBooks, ...archivedBooks].find((book) => book.id === bookId);
    if (openingBook?.status !== 'READING') {
      setShouldStartReading(false);
      setSelectedBookId(bookId);
      setOpeningBookId(null);
      setBookOpeningPhase(null);
      setOpeningPageCount(0);
      return;
    }
    if (prefersReducedMotion()) {
      setShouldStartReading(startInReadingContext);
      setSelectedBookId(bookId);
      setOpeningBookId(null);
      setBookOpeningPhase(null);
      setOpeningPageCount(0);
      return;
    }
    const recordCount = Number(openingBook?.recordCount ?? 0);
    const pagesToTurn = openingBook?.status === 'COMPLETED' ? 5 : recordCount > 0 ? 3 : 0;

    function zoomAndShowDetail() {
      setBookOpeningPhase('zooming');
      openingTimerRef.current = window.setTimeout(() => {
        setSelectedBookId(bookId);
        setOpeningBookId(null);
        setBookOpeningPhase(null);
        setOpeningPageCount(0);
        openingTimerRef.current = null;
      }, 520);
    }

    function turnNextPage(pageNumber) {
      if (pageNumber > pagesToTurn) {
        openingTimerRef.current = window.setTimeout(zoomAndShowDetail, 700);
        return;
      }

      openingTimerRef.current = window.setTimeout(() => {
        setOpeningPageCount(pageNumber);
        turnNextPage(pageNumber + 1);
      }, 700);
    }

    setShouldStartReading(startInReadingContext);
    setOpeningBookId(bookId);
    setBookOpeningPhase('pulling');
    setOpeningPageCount(0);
    openingTimerRef.current = window.setTimeout(() => {
      setBookOpeningPhase('turning');
      openingTimerRef.current = window.setTimeout(() => {
        setBookOpeningPhase('opening');
        if (pagesToTurn > 0) {
          turnNextPage(1);
        } else {
          openingTimerRef.current = window.setTimeout(zoomAndShowDetail, 700);
        }
      }, 520);
    }, 420);
  }

  async function handleCreateBook(input) {
    const newBook = await createBook(input);
    setBooks((currentBooks) => [newBook, ...currentBooks]);
    openBook(newBook.id, false, newBook);
  }

  async function handleSaveRecord(bookId, recordInput) {
    await createReadingRecord({ bookId, ...recordInput });
    if (recordInput.quoteExposureId) setActiveQuoteExposureId(null);
    await refreshBookData(bookId);
  }

  async function refreshShelves() {
    const shelf = await getBooks();
    setBooks(shelf.reading);
    setCompletedBooks(shelf.completed);
    setArchivedBooks(shelf.archived);
  }

  async function refreshBookData(bookId) {
    const [, refreshedDetail] = await Promise.all([
      refreshShelves(),
      getBook(bookId),
    ]);
    setBookDetail(refreshedDetail);
  }

  async function handleUpdateStatus(bookId, statusInput) {
    await updateBookStatus({ bookId, ...statusInput });
    await refreshBookData(bookId);
  }

  async function handleRestoreBook(bookId) {
    await updateBookStatus({ bookId, status: 'READING' });
    await refreshShelves();
  }

  async function handleUpdateRecord(bookId, recordId, recordInput) {
    await updateReadingRecord({ bookId, recordId, ...recordInput });
    await refreshBookData(bookId);
  }

  async function handleDeleteRecord(bookId, recordId) {
    await deleteReadingRecord({ bookId, recordId });
    await refreshBookData(bookId);
  }

  function handleSelectBook(bookId) {
    openBook(bookId);
  }

  function handleContinueReading(bookId) {
    openBook(bookId, true);
  }

  function handleOpenQuote() {
    if (!quote) return;
    if (quoteExposure) {
      openQuoteExposure(quoteExposure.id).catch(() => {});
      setActiveQuoteExposureId(quoteExposure.id);
    }
    openBook(quote.bookId, true);
  }

  if (isAuthLoading) {
    return <main className="bookshelf-preview"><p className="bookshelf-status">잇장을 불러오고 있어요.</p></main>;
  }

  if (!user) {
    return <OnboardingPage onComplete={handleOnboardingComplete} />;
  }

  if (isBooksLoading) {
    return <main className="bookshelf-preview"><p className="bookshelf-status">책장을 불러오고 있어요.</p></main>;
  }

  if (booksError) {
    return <main className="bookshelf-preview"><p className="bookshelf-status field-error" role="alert">{booksError}</p></main>;
  }

  return (
    <>
      {selectedBookId && isBookDetailLoading ? (
        <main className="book-detail"><p className="bookshelf-status">책의 기록을 불러오고 있어요.</p></main>
      ) : selectedBookId && bookDetailError ? (
        <main className="book-detail"><p className="bookshelf-status field-error" role="alert">{bookDetailError}</p></main>
      ) : selectedBookId && bookDetail ? (
        <BookDetailScreen
          key={`${bookDetail.id}-${shouldStartReading}`}
          book={bookDetail}
          userId={user.id}
          quoteExposureId={quote?.bookId === bookDetail.id ? activeQuoteExposureId : null}
          startInReadingContext={shouldStartReading}
          onBackToBookshelf={() => {
            setSelectedBookId(null);
            setShouldStartReading(false);
            setBookOpeningPhase(null);
            setOpeningPageCount(0);
          }}
          onSaveRecord={handleSaveRecord}
          onUpdateRecord={handleUpdateRecord}
          onDeleteRecord={handleDeleteRecord}
          onUpdateStatus={handleUpdateStatus}
        />
      ) : books.length || completedBooks.length || archivedBooks.length ? (
        <ReadingBookshelf
          user={user}
          books={books}
          completedBooks={completedBooks}
          archivedBooks={archivedBooks}
          openingBookId={openingBookId}
          bookOpeningPhase={bookOpeningPhase}
          openingPageCount={openingPageCount}
          onAddBook={() => setIsAddBookOpen(true)}
          onSelectBook={handleSelectBook}
          onContinueReading={handleContinueReading}
          onRestoreBook={handleRestoreBook}
          quote={quote}
          onOpenQuote={handleOpenQuote}
        />
      ) : (
        <EmptyBookshelf user={user} onAddBook={() => setIsAddBookOpen(true)} />
      )}
      <AddBookDialog
        open={isAddBookOpen}
        onOpenChange={setIsAddBookOpen}
        onCreateBook={handleCreateBook}
      />
    </>
  );
}
