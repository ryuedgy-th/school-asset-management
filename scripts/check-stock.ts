
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking for assets with 0 stock...');

    const zeroStockAssets = await prisma.asset.findMany({
        where: {
            currentStock: 0
        },
        select: {
            id: true,
            assetCode: true,
            name: true,
            status: true,
            totalStock: true
        }
    });

    console.log(`Found ${zeroStockAssets.length} assets with 0 stock.`);

    for (const asset of zeroStockAssets) {
        console.log(`- [${asset.assetCode}] ${asset.name} | Status: ${asset.status} | Total: ${asset.totalStock}`);

        // If unique item (Total 1) has 0 stock, it SHOULD be Borrowed, Lost, Maint. 
        // If it is 'Available' but stock is 0, that's a BUG.
        if (asset.totalStock === 1 && asset.status === 'Available') {
            console.log(`   🚨 BUG: Status is Available but Stock is 0! Fixing...`);
            await prisma.asset.update({
                where: { id: asset.id },
                data: { currentStock: 1 }
            });
            console.log(`   ✅ FIXED: Reset stock to 1`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
