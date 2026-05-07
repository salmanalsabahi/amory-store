import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
}

export function LoadingSpinner({ className, size = 'md', label }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className={cn("flex flex-col items-center justify-center p-8", className)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative"
      >
        <Loader2 className={cn("animate-spin text-amber-500", sizeClasses[size])} />
        <motion.div
           animate={{ 
             scale: [1, 1.2, 1],
             opacity: [0.1, 0.3, 0.1]
           }}
           transition={{ 
             duration: 2,
             repeat: Infinity,
             ease: "easeInOut"
           }}
           className={cn("absolute inset-0 bg-amber-500 rounded-full blur-xl", sizeClasses[size])}
        />
      </motion.div>
      {label && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-slate-500 font-display font-medium text-sm tracking-wide"
        >
          {label}
        </motion.p>
      )}
    </div>
  );
}
