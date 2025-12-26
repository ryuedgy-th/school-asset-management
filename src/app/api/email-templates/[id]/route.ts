import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET - Get single email template
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const template = await prisma.emailTemplate.findUnique({
            where: { id: parseInt(id) },
            include: {
                emailAccount: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            }
        });

        if (!template) {
            return NextResponse.json(
                { error: 'Email template not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(template);
    } catch (error) {
        console.error('Error fetching email template:', error);
        return NextResponse.json(
            { error: 'Failed to fetch email template' },
            { status: 500 }
        );
    }
}

// PUT - Update email template
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();

        const {
            name,
            subject,
            body: templateBody,
            variables,
            category,
            emailAccountId,
            isActive,
        } = body;

        const template = await prisma.emailTemplate.update({
            where: { id: parseInt(id) },
            data: {
                name,
                subject,
                body: templateBody,
                variables: variables ? JSON.stringify(variables) : undefined,
                category,
                emailAccountId: emailAccountId ? parseInt(emailAccountId) : null,
                isActive,
            },
            include: {
                emailAccount: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            }
        });

        return NextResponse.json(template);
    } catch (error: any) {
        console.error('Error updating email template:', error);

        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Email template not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to update email template' },
            { status: 500 }
        );
    }
}

// DELETE - Delete email template
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await prisma.emailTemplate.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting email template:', error);

        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Email template not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to delete email template' },
            { status: 500 }
        );
    }
}
