import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from './cn';

export type BottomSheetProps = {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
};

export function BottomSheet({ isOpen, onClose, children, className }: BottomSheetProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose?.();
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose?.();
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className='fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-black/60 px-2 pt-2 backdrop-blur-sm'
    >
      <div
        className={cn(
          'flex w-full min-w-0 max-h-[82dvh] flex-col sm:max-w-lg sm:max-h-[calc(100dvh-2rem)]',
          className,
        )}
      >
        <div className='mx-auto mb-2 h-1.5 w-12 rounded-full bg-white/20' />
        <div className='min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]'>
          {children}
        </div>
      </div>
    </div>
  );
}
