import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testRoleUpdate() {
    try {
        console.log('🧪 Testing role update with departmentId = null...\n');

        const testPayload = {
            name: 'User',
            departmentId: null,
            scope: 'department',
            isActive: true,
            permissions: JSON.stringify({
                scope: 'department',
                modules: {
                    assets: {
                        enabled: true,
                        permissions: ['view', 'create']
                    }
                }
            })
        };

        console.log('Payload:', JSON.stringify(testPayload, null, 2));

        const result = await prisma.role.update({
            where: { id: 3 },
            data: testPayload,
        });

        console.log('\n✅ Update successful!');
        console.log('Result:', result);

    } catch (error: any) {
        console.error('\n❌ Update failed!');
        console.error('Error:', error.message);
        console.error('Full error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testRoleUpdate();
