'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import NewAssignmentModal from '@/components/BorrowFlow/NewAssignmentModal';

export default function NewAssignmentButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium shadow-sm transition-colors"
            >
                <Plus size={18} />
                New Assignment
            </button>

            {isOpen && <NewAssignmentModal onClose={() => setIsOpen(false)} />}
        </>
    );
}
