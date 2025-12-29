import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// PUT - Update user profile
export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, nickname, email } = await req.json();

        // Check if email is already taken by another user
        if (email !== session.user.email) {
            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                return NextResponse.json(
                    { error: 'Email already in use' },
                    { status: 400 }
                );
            }
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                name: name || null,
                nickname: nickname || null,
                email,
            },
            select: {
                id: true,
                name: true,
                nickname: true,
                email: true,
            }
        });

        return NextResponse.json({
            success: true,
            user: updatedUser
        });

    } catch (error: any) {
        console.error('Error updating profile:', error);
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        );
    }
}
