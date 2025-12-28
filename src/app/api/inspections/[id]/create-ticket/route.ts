import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createTicketFromInspection } from '@/lib/inspection-ticket-actions';

/**
 * Manual ticket creation from inspection
 * POST /api/inspections/[id]/create-ticket
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const inspectionId = parseInt(id);

        // Create ticket from inspection
        const ticket = await createTicketFromInspection(inspectionId);

        if (!ticket) {
            return NextResponse.json(
                { error: 'No damage found in inspection, cannot create ticket' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            ticket: {
                id: ticket.id,
                ticketNumber: ticket.ticketNumber,
                title: ticket.title,
                status: ticket.status,
                priority: ticket.priority,
            }
        });
    } catch (error: any) {
        console.error('Error creating ticket from inspection:', error);

        // Handle specific errors
        if (error.message === 'Inspection not found') {
            return NextResponse.json(
                { error: 'Inspection not found' },
                { status: 404 }
            );
        }

        if (error.message.includes('already exists')) {
            return NextResponse.json(
                { error: 'Ticket already exists for this inspection' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create ticket' },
            { status: 500 }
        );
    }
}
