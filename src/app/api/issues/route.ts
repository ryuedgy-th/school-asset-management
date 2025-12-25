import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { assetId, reporterName, description } = body;

        if (!assetId || !description) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const issue = await prisma.issueReport.create({
            data: {
                assetId,
                reporterName: reporterName || 'Anonymous',
                description,
                status: 'Open',
            },
        });

        // Optional: Update asset status to 'Maintenance' or 'Broken' automatically?
        // Let's keep it manual for now, or maybe set to 'Maintenance' if authorized.
        // For public reporting, maybe just log the issue.

        // If we want to auto-flag asset as "Broken" on report:
        // await prisma.asset.update({ where: { id: assetId }, data: { status: 'Broken' } });

        return NextResponse.json(issue, { status: 201 });
    } catch (error) {
        console.error('Error creating issue report:', error);
        return NextResponse.json(
            { error: 'Failed to report issue' },
            { status: 500 }
        );
    }
}
