import { useState, createContext, useContext, useCallback } from 'react';
import { CheckCircle, XCircle, X, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: string; message: string; type: ToastType; }
interface ToastContextValue { showToast: (message: string, type?: ToastType) => void; }

const ToastContext = createContext<ToastContextValue>({ showToast: () => { } });
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);

    const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`
              flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-sm font-medium pointer-events-auto
              transition-all duration-300 animate-in slide-in-from-right max-w-[320px]
              ${toast.type === 'success' ? 'bg-green-600 text-white' : toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'}
            `}
                    >
                        {toast.type === 'success' && <CheckCircle className="w-4 h-4 shrink-0" />}
                        {toast.type === 'error' && <XCircle className="w-4 h-4 shrink-0" />}
                        {toast.type === 'info' && <Info className="w-4 h-4 shrink-0" />}
                        <span className="flex-1">{toast.message}</span>
                        <button onClick={() => remove(toast.id)} className="opacity-70 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
