'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import BorrowForm from '@/components/BorrowFlow/BorrowForm';

export default async function NewBorrowPage() {
    const session = await auth();
    if (!session?.user?.id) return <div>Unauthorized</div>;

    const userId = Number(session.user.id);
    const currentYear = new Date().getFullYear().toString(); // Simple logic
    const currentSemester = 1; // Need logic or config for this

    // Check for active assignment
    const activeAssignment = await prisma.assignment.findFirst({
        where: {
            userId,
            status: 'Active',
            academicYear: currentYear
        }
    });

    return (
        <div className="max-w-2xl mx-auto py-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">New Equipment Request</h1>
            <p className="text-slate-500 mb-8">
                {activeAssignment
                    ? `Adding items to existing assignment ${activeAssignment.assignmentNumber}`
                    : `Starting new assignment for Academic Year ${currentYear}`
                }
            </p>

            <BorrowForm
                userId={userId}
                activeAssignmentId={activeAssignment?.id}
                academicYear={currentYear}
                semester={currentSemester}
            />
        </div>
    );
}
