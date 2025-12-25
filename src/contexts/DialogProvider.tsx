'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import AlertDialog, { AlertVariant } from '@/components/ui/AlertDialog';
import ConfirmDialog, { ConfirmVariant } from '@/components/ui/ConfirmDialog';

interface AlertOptions {
    title: string;
    message: string;
    variant?: AlertVariant;
    autoCloseMs?: number;
}

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmVariant;
}

interface DialogContextValue {
    alert: (options: AlertOptions) => Promise<void>;
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
    const [alertState, setAlertState] = useState<{
        isOpen: boolean;
        options: AlertOptions;
        resolve?: () => void;
    }>({
        isOpen: false,
        options: { title: '', message: '' }
    });

    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        options: ConfirmOptions;
        resolve?: (value: boolean) => void;
    }>({
        isOpen: false,
        options: { title: '', message: '' }
    });

    const alert = useCallback((options: AlertOptions): Promise<void> => {
        return new Promise((resolve) => {
            setAlertState({
                isOpen: true,
                options,
                resolve
            });
        });
    }, []);

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfirmState({
                isOpen: true,
                options,
                resolve
            });
        });
    }, []);

    const handleAlertClose = useCallback(() => {
        alertState.resolve?.();
        setAlertState({
            isOpen: false,
            options: { title: '', message: '' }
        });
    }, [alertState.resolve]);

    const handleConfirmConfirm = useCallback(() => {
        confirmState.resolve?.(true);
        setConfirmState({
            isOpen: false,
            options: { title: '', message: '' }
        });
    }, [confirmState.resolve]);

    const handleConfirmCancel = useCallback(() => {
        confirmState.resolve?.(false);
        setConfirmState({
            isOpen: false,
            options: { title: '', message: '' }
        });
    }, [confirmState.resolve]);

    return (
        <DialogContext.Provider value={{ alert, confirm }}>
            {children}

            <AlertDialog
                isOpen={alertState.isOpen}
                onClose={handleAlertClose}
                title={alertState.options.title}
                message={alertState.options.message}
                variant={alertState.options.variant}
                autoCloseMs={alertState.options.autoCloseMs}
            />

            <ConfirmDialog
                isOpen={confirmState.isOpen}
                onConfirm={handleConfirmConfirm}
                onCancel={handleConfirmCancel}
                title={confirmState.options.title}
                message={confirmState.options.message}
                confirmText={confirmState.options.confirmText}
                cancelText={confirmState.options.cancelText}
                variant={confirmState.options.variant}
            />
        </DialogContext.Provider>
    );
}

export function useDialog() {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error('useDialog must be used within DialogProvider');
    }
    return context;
}

// Convenience hooks
export function useAlert() {
    const { alert } = useDialog();
    return { alert };
}

export function useConfirm() {
    const { confirm } = useDialog();
    return { confirm };
}
