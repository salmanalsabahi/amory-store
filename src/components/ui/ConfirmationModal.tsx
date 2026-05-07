import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  variant = 'danger'
}) {
  if (!isOpen) return null;

  const variants = {
    danger: {
      icon: <AlertTriangle className="w-8 h-8 text-rose-500" />,
      bg: 'bg-rose-50',
      button: 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
    },
    warning: {
      icon: <AlertTriangle className="w-8 h-8 text-amber-500" />,
      bg: 'bg-amber-50',
      button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
    },
    info: {
      icon: <AlertTriangle className="w-8 h-8 text-blue-500" />,
      bg: 'bg-blue-50',
      button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
    }
  };

  const current = variants[variant] || variants.danger;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="p-8 md:p-10 text-center space-y-6">
            <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mx-auto", current.bg)}>
              {current.icon}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900">{title}</h3>
              <p className="text-slate-500 font-medium leading-relaxed">{message}</p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={onClose}
                className="flex-1 py-4 px-6 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={cn("flex-[2] py-4 px-6 rounded-2xl text-white font-black shadow-lg transition-all active:scale-95", current.button)}
              >
                {confirmText}
              </button>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
