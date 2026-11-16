import { useState, useEffect, useMemo, useRef } from 'react';
import { trackTitleView } from '../../lib/analytics';

interface TypingTitleProps {
  titles: string[];
  baseText?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  /** Bump this to skip titles: +1 next, -1 previous. Driven by the D-pad. */
  jump?: number;
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function TypingTitle({
  titles,
  baseText = '',
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseDuration = 2000,
  jump = 0,
}: TypingTitleProps) {
  const shuffledTitles = useMemo(() => shuffleArray(titles), [titles]);
  
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  // Starts paused so the initial delay runs before the first character
  const [isPaused, setIsPaused] = useState(true);

  // D-pad left/right skips the type/delete cycle and jumps straight to a title
  const lastJump = useRef(jump);
  useEffect(() => {
    if (jump === lastJump.current) return;
    const delta = jump - lastJump.current;
    lastJump.current = jump;
    const len = shuffledTitles.length;
    setCurrentTitleIndex((prev) => ((prev + delta) % len + len) % len);
    setDisplayedText('');
    setIsDeleting(false);
    setIsPaused(false);
  }, [jump, shuffledTitles.length]);

  useEffect(() => {
    if (isPaused && displayedText === '') {
      const initialTimer = setTimeout(() => {
        setIsPaused(false);
      }, 500);
      return () => clearTimeout(initialTimer);
    }

    if (isPaused && displayedText.length > 0) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseDuration);
      return () => clearTimeout(pauseTimer);
    }

    const currentTitle = shuffledTitles[currentTitleIndex];
    if (!currentTitle) return;

    const speed = isDeleting ? deletingSpeed : typingSpeed;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (displayedText.length < currentTitle.length) {
          setDisplayedText(currentTitle.slice(0, displayedText.length + 1));
        } else {
          // Only fully typed titles count as viewed
          trackTitleView(currentTitle);
          setIsPaused(true);
        }
      } else {
        if (displayedText.length > 0) {
          setDisplayedText(displayedText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentTitleIndex((prev) => (prev + 1) % shuffledTitles.length);
        }
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, isPaused, currentTitleIndex, shuffledTitles, typingSpeed, deletingSpeed, pauseDuration]);

  return (
    <span>
      {baseText}
      {displayedText}
      <span className="text-screen-3 animate-caret" aria-hidden="true">█</span>
    </span>
  );
}

