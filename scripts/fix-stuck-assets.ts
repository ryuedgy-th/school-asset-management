
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking for stuck assets...');

    // Find all assets that are marked as "Borrowed"
    const borrowedAssets = await prisma.asset.findMany({
        where: {
            status: 'Borrowed',
            totalStock: 1 // Only target unique items for safety first
        },
        include: {
            borrowItems: {
                where: {
                    status: 'Borrowed'
                }
            }
        }
    });

    console.log(`Found ${borrowedAssets.length} assets marked as 'Borrowed'. Checking integrity...`);

    for (const asset of borrowedAssets) {
        // If there are no active borrow items, but asset is Borrowed -> It's STUCK.
        if (asset.borrowItems.length === 0) {
            console.log(`❌ FOUND STUCK ASSET: [${asset.assetCode}] ${asset.name}`);

            // Fix it
            await prisma.asset.update({
                where: { id: asset.id },
                data: {
                    status: 'Available',
                    currentStock: 1
                }
            });
            console.log(`   ✅ FIXED: Set to 'Available' and currentStock = 1`);
        } else {
            // console.log(`   OK: [${asset.assetCode}] has active transaction.`);
        }
    }

    console.log('✨ Check complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
