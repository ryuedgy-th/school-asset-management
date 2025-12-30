import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET: Fetch all numbering configurations
export async function GET() {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const configs = await prisma.numberingConfig.findMany({
            orderBy: { module: 'asc' }
        });

        return NextResponse.json(configs);
    } catch (error) {
        console.error('Error fetching numbering configs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch numbering configurations' },
            { status: 500 }
        );
    }
}

// PUT: Update numbering configuration for a module
export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const {
            module,
            prefix,
            includeYear,
            includeMonth,
            sequenceDigits,
            separator,
            resetAnnually
        } = body;

        // Validate required fields
        if (!module || !prefix) {
            return NextResponse.json(
                { error: 'Module and prefix are required' },
                { status: 400 }
            );
        }

        // Generate example output
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const seq = '1'.padStart(sequenceDigits, '0');

        let exampleParts = [prefix];
        if (includeYear) {
            if (includeMonth) {
                exampleParts.push(`${year}${separator}${month}`);
            } else {
                exampleParts.push(String(year));
            }
        }
        exampleParts.push(seq);
        const exampleOutput = exampleParts.join(separator);

        // Upsert configuration
        const config = await prisma.numberingConfig.upsert({
            where: { module },
            create: {
                module,
                prefix,
                includeYear,
                includeMonth,
                sequenceDigits,
                separator,
                resetAnnually,
                exampleOutput,
                currentSeq: 0
            },
            update: {
                prefix,
                includeYear,
                includeMonth,
                sequenceDigits,
                separator,
                resetAnnually,
                exampleOutput
            }
        });

        return NextResponse.json(config);
    } catch (error) {
        console.error('Error updating numbering config:', error);
        return NextResponse.json(
            { error: 'Failed to update numbering configuration' },
            { status: 500 }
        );
    }
}

// POST: Initialize default configurations for all modules
export async function POST() {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const defaultConfigs = [
            {
                module: 'assets',
                prefix: 'IT',
                includeYear: true,
                includeMonth: false,
                sequenceDigits: 3,
                separator: '-',
                resetAnnually: true,
                exampleOutput: 'IT-2025-001',
                currentSeq: 0
            },
            {
                module: 'tickets',
                prefix: 'TKT',
                includeYear: true,
                includeMonth: false,
                sequenceDigits: 3,
                separator: '-',
                resetAnnually: true,
                exampleOutput: 'TKT-2025-001',
                currentSeq: 0
            },
            {
                module: 'inspections',
                prefix: 'INS',
                includeYear: true,
                includeMonth: false,
                sequenceDigits: 3,
                separator: '-',
                resetAnnually: true,
                exampleOutput: 'INS-2025-001',
                currentSeq: 0
            },
            {
                module: 'assignments',
                prefix: 'ASG',
                includeYear: true,
                includeMonth: false,
                sequenceDigits: 3,
                separator: '-',
                resetAnnually: true,
                exampleOutput: 'ASG-2025-001',
                currentSeq: 0
            },
            {
                module: 'fm_assets',
                prefix: 'FM',
                includeYear: true,
                includeMonth: false,
                sequenceDigits: 3,
                separator: '-',
                resetAnnually: true,
                exampleOutput: 'FM-2025-001',
                currentSeq: 0
            }
        ];

        // Create configs that don't exist yet
        for (const config of defaultConfigs) {
            await prisma.numberingConfig.upsert({
                where: { module: config.module },
                create: config,
                update: {} // Don't update if exists
            });
        }

        const allConfigs = await prisma.numberingConfig.findMany({
            orderBy: { module: 'asc' }
        });

        return NextResponse.json(allConfigs);
    } catch (error) {
        console.error('Error initializing numbering configs:', error);
        return NextResponse.json(
            { error: 'Failed to initialize numbering configurations' },
            { status: 500 }
        );
    }
}
