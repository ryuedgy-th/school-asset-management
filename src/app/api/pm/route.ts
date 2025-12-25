import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { title, date, type, description } = body;

        const task = await prisma.pMTask.create({
            data: {
                title,
                scheduledDate: new Date(date),
                type,
                description,
                status: 'Pending'
            }
        });

        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, status, resultNotes } = body;

        const task = await prisma.pMTask.update({
            where: { id },
            data: {
                status,
                resultNotes
            }
        });

        return NextResponse.json(task);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }
}
