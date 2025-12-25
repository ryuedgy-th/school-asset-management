import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        let { assetId, startDate, endDate, reason } = body;

        if (!assetId || !startDate || !endDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const assetIdInt = parseInt(assetId);

        const asset = await prisma.asset.findUnique({ where: { id: assetIdInt } });

        if (!asset) {
            return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
        }

        // Logic check: Can we request if status is 'Borrowed'? Maybe to queue?
        // For now, let's allow requesting even if borrowed (Waitlist), or restrict.
        // Plan says: "Request is Pending, Asset stays Available until approved".
        // So we allow creation regardless of status? No, if it's 'Broken' or 'Lost' we probably shouldn't.
        if (['Broken', 'Lost', 'Retired'].includes(asset.status)) {
            return NextResponse.json({ error: 'Asset is not available for borrowing' }, { status: 400 });
        }

        const borrowRequest = await prisma.borrowRequest.create({
            data: {
                userId: parseInt(session.user.id),
                assetId: assetIdInt,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason,
                status: 'Pending',
            },
        });

        return NextResponse.json(borrowRequest, { status: 201 });

    } catch (error) {
        console.error('Error creating borrow request:', error);
        return NextResponse.json({ error: 'Failed to create borrow request' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { id: parseInt(session.user.id) } });
        const isAdmin = user?.role === 'Admin' || user?.role === 'Technician';

        const where = isAdmin ? {} : { userId: parseInt(session.user.id) };

        const requests = await prisma.borrowRequest.findMany({
            where,
            include: {
                user: { select: { name: true, email: true } },
                asset: { select: { name: true, assetCode: true, image: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(requests);

    } catch (error) {
        console.error('Error fetching borrow requests:', error);
        return NextResponse.json({ error: 'Failed to fetch borrow requests' }, { status: 500 });
    }
}
