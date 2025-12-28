import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export interface SLASettings {
    urgent: number;
    high: number;
    medium: number;
    low: number;
    atRiskThreshold: number;
}

// GET /api/settings/sla - Get SLA settings
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all SLA settings from database
        const slaSettings = await prisma.systemSettings.findMany({
            where: {
                category: 'sla',
            },
        });

        // Transform to object format
        const settings: SLASettings = {
            urgent: 2,
            high: 8,
            medium: 24,
            low: 72,
            atRiskThreshold: 20,
        };

        slaSettings.forEach((setting) => {
            const value = parseInt(setting.value || '0');
            switch (setting.key) {
                case 'sla_urgent_hours':
                    settings.urgent = value;
                    break;
                case 'sla_high_hours':
                    settings.high = value;
                    break;
                case 'sla_medium_hours':
                    settings.medium = value;
                    break;
                case 'sla_low_hours':
                    settings.low = value;
                    break;
                case 'sla_at_risk_threshold':
                    settings.atRiskThreshold = value;
                    break;
            }
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error fetching SLA settings:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT /api/settings/sla - Update SLA settings
export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // TODO: Add admin role check
        // For now, any authenticated user can update settings

        const body = await req.json();
        const { urgent, high, medium, low, atRiskThreshold } = body as SLASettings;

        // Validate input
        if (
            typeof urgent !== 'number' || urgent <= 0 ||
            typeof high !== 'number' || high <= 0 ||
            typeof medium !== 'number' || medium <= 0 ||
            typeof low !== 'number' || low <= 0 ||
            typeof atRiskThreshold !== 'number' || atRiskThreshold <= 0 || atRiskThreshold > 100
        ) {
            return NextResponse.json(
                { error: 'Invalid SLA values. All hours must be positive numbers, and threshold must be between 1-100%' },
                { status: 400 }
            );
        }

        // Update all SLA settings
        await Promise.all([
            prisma.systemSettings.upsert({
                where: { key: 'sla_urgent_hours' },
                update: { value: urgent.toString(), updatedAt: new Date() },
                create: { key: 'sla_urgent_hours', value: urgent.toString(), category: 'sla', isSecret: false },
            }),
            prisma.systemSettings.upsert({
                where: { key: 'sla_high_hours' },
                update: { value: high.toString(), updatedAt: new Date() },
                create: { key: 'sla_high_hours', value: high.toString(), category: 'sla', isSecret: false },
            }),
            prisma.systemSettings.upsert({
                where: { key: 'sla_medium_hours' },
                update: { value: medium.toString(), updatedAt: new Date() },
                create: { key: 'sla_medium_hours', value: medium.toString(), category: 'sla', isSecret: false },
            }),
            prisma.systemSettings.upsert({
                where: { key: 'sla_low_hours' },
                update: { value: low.toString(), updatedAt: new Date() },
                create: { key: 'sla_low_hours', value: low.toString(), category: 'sla', isSecret: false },
            }),
            prisma.systemSettings.upsert({
                where: { key: 'sla_at_risk_threshold' },
                update: { value: atRiskThreshold.toString(), updatedAt: new Date() },
                create: { key: 'sla_at_risk_threshold', value: atRiskThreshold.toString(), category: 'sla', isSecret: false },
            }),
        ]);

        // Clear SLA cache after update
        const { clearSLACache } = await import('@/lib/sla');
        clearSLACache();

        return NextResponse.json({
            message: 'SLA settings updated successfully',
            settings: { urgent, high, medium, low, atRiskThreshold },
        });
    } catch (error) {
        console.error('Error updating SLA settings:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
