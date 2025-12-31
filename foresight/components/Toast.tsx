import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Return a no-op if used outside provider (for safety)
    return { showToast: () => {} };
  }
  return context;
};

const ToastIcon = ({ type }: { type: ToastType }) => {
  switch (type) {
    case 'success':
      return <Check size={18} className="text-mint" />;
    case 'error':
      return <X size={18} className="text-danger" />;
    case 'warning':
      return <AlertTriangle size={18} className="text-warning" />;
    case 'info':
      return <Info size={18} className="text-blue-400" />;
  }
};

const getToastStyles = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'border-mint/30 bg-mint/10';
    case 'error':
      return 'border-danger/30 bg-danger/10';
    case 'warning':
      return 'border-warning/30 bg-warning/10';
    case 'info':
      return 'border-blue-400/30 bg-blue-400/10';
  }
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={`pointer-events-auto max-w-sm w-full bg-surface-200 border rounded-xl shadow-2xl overflow-hidden ${getToastStyles(toast.type)}`}
            >
              <div className="flex items-center gap-3 p-4">
                <div className="shrink-0">
                  <ToastIcon type={toast.type} />
                </div>
                <p className="flex-1 text-white text-sm font-medium">{toast.message}</p>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="shrink-0 p-1 hover:bg-surface-300 rounded-full transition-colors"
                >
                  <X size={16} className="text-neutral-500" />
                </button>
              </div>
              
              {/* Progress bar */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 4, ease: 'linear' }}
                className={`h-0.5 ${
                  toast.type === 'success' ? 'bg-mint' :
                  toast.type === 'error' ? 'bg-danger' :
                  toast.type === 'warning' ? 'bg-warning' :
                  'bg-blue-400'
                }`}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;

