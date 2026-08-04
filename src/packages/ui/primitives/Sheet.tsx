import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from 'lucide-react';
import { spring } from '../motion';

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
};

export function Sheet({ open, onClose, title, children, footer }: SheetProps) {
  return (
    <AnimatePresence>
      {open &&
      <div className="absolute inset-0 z-50 flex flex-col justify-end">
          <motion.button
          type="button"
          aria-label="Close"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-ink/25" />
        
          <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={spring}
          className="relative rounded-t-3xl border-t border-ink-line bg-canvas px-5 pb-6 pt-3">
          
            <div aria-hidden="true" className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-ink-line" />
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-[17px] font-bold tracking-tight text-ink">{title}</h2>
              <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/5 text-ink-soft hover:bg-ink/10">
              
                <XIcon className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
            {children}
            {footer && <div className="mt-5">{footer}</div>}
          </motion.div>
        </div>
      }
    </AnimatePresence>);

}