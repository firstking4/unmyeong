import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { ReviewPromptToast } from '@/components/ui/ReviewPromptToast';

type ReviewPromptContextValue = {
  showReviewPrompt: () => void;
};

const ReviewPromptContext = createContext<ReviewPromptContextValue | null>(null);

export function ReviewPromptProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);

  const showReviewPrompt = useCallback(() => {
    setVisible(true);
  }, []);

  const value = useMemo(() => ({ showReviewPrompt }), [showReviewPrompt]);

  return (
    <ReviewPromptContext.Provider value={value}>
      {children}
      <ReviewPromptToast visible={visible} onDismiss={() => setVisible(false)} />
    </ReviewPromptContext.Provider>
  );
}

export function useReviewPrompt() {
  const ctx = useContext(ReviewPromptContext);
  if (!ctx) {
    throw new Error('useReviewPrompt must be used within ReviewPromptProvider');
  }
  return ctx;
}
