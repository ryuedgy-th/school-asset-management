'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { deleteAssignment } from '@/app/lib/borrow-actions';

export default function DeleteAssignmentButton({ id }: { id: number }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this assignment?')) return;

        startTransition(async () => {
            try {
                await deleteAssignment(id);
                // Router refresh to update UI if action doesn't automatically trigger it effectively via revalidatePath
                router.refresh();
            } catch (error: any) {
                alert(error.message || 'Failed to delete assignment');
            }
        });
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-1 px-2 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
            title="Delete Assignment"
        >
            <Trash2 size={18} />
        </button>
    );
}
