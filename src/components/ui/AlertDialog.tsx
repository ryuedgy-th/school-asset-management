'use client';

import { X, AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { useEffect } from 'react';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    variant?: AlertVariant;
    autoCloseMs?: number;
}

const variantStyles = {
    success: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'text-green-600',
        button: 'bg-green-600 hover:bg-green-700',
        Icon: CheckCircle2
    },
    error: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-600',
        button: 'bg-red-600 hover:bg-red-700',
        Icon: AlertCircle
    },
    warning: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: 'text-amber-600',
        button: 'bg-amber-600 hover:bg-amber-700',
        Icon: AlertTriangle
    },
    info: {
        bg: 'bg-primary/10',
        border: 'border-blue-200',
        icon: 'text-primary',
        button: 'bg-primary hover:bg-primary/90',
        Icon: Info
    }
};

export default function AlertDialog({
    isOpen,
    onClose,
    title,
    message,
    variant = 'info',
    autoCloseMs
}: AlertDialogProps) {
    const styles = variantStyles[variant];
    const IconComponent = styles.Icon;

    useEffect(() => {
        if (!isOpen || !autoCloseMs) return;

        const timer = setTimeout(() => {
            onClose();
        }, autoCloseMs);

        return () => clearTimeout(timer);
    }, [isOpen, autoCloseMs, onClose]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' || e.key === 'Enter') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className={`${styles.bg} ${styles.border} border-b px-6 py-4 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                        <IconComponent className={styles.icon} size={24} />
                        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/50 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                    <p className="text-slate-700 whitespace-pre-line">{message}</p>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className={`px-6 py-2.5 ${styles.button} text-white rounded-lg font-medium transition-colors`}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}
