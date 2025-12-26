import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// PUT - Upload profile photo
export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { image } = await req.json();

        if (!image || !image.startsWith('data:image/')) {
            return NextResponse.json(
                { error: 'Invalid image data' },
                { status: 400 }
            );
        }

        // Update user image
        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: { image },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
            }
        });

        return NextResponse.json({
            success: true,
            user: updatedUser
        });

    } catch (error: any) {
        console.error('Error uploading photo:', error);
        return NextResponse.json(
            { error: 'Failed to upload photo' },
            { status: 500 }
        );
    }
}

// DELETE - Remove profile photo
export async function DELETE(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Remove user image
        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: { image: null },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
            }
        });

        return NextResponse.json({
            success: true,
            user: updatedUser
        });

    } catch (error: any) {
        console.error('Error removing photo:', error);
        return NextResponse.json(
            { error: 'Failed to remove photo' },
            { status: 500 }
        );
    }
}
