import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET - List all email templates
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');

        const templates = await prisma.emailTemplate.findMany({
            where: category ? { category } : undefined,
            include: {
                emailAccount: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(templates);
    } catch (error) {
        console.error('Error fetching email templates:', error);
        return NextResponse.json(
            { error: 'Failed to fetch email templates' },
            { status: 500 }
        );
    }
}

// POST - Create new email template
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const {
            name,
            subject,
            body: templateBody,
            variables,
            category,
            emailAccountId,
        } = body;

        // Validate required fields
        if (!name || !subject || !templateBody || !category) {
            return NextResponse.json(
                { error: 'Name, subject, body, and category are required' },
                { status: 400 }
            );
        }

        const template = await prisma.emailTemplate.create({
            data: {
                name,
                subject,
                body: templateBody,
                variables: JSON.stringify(variables || []),
                category,
                emailAccountId: emailAccountId ? parseInt(emailAccountId) : null,
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

        return NextResponse.json(template, { status: 201 });
    } catch (error: any) {
        console.error('Error creating email template:', error);

        return NextResponse.json(
            { error: 'Failed to create email template' },
            { status: 500 }
        );
    }
}
