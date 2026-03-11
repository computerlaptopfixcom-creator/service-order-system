import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    console.log("Checking orders for consistency...");

    try {
        const orders = await prisma.order.findMany();
        console.log(`Found ${orders.length} orders.`);

        for (const o of orders) {
            let issues: string[] = [];

            if (!o.orderNumber) issues.push("Missing orderNumber");
            if (!o.createdAt) issues.push("Missing createdAt");
            else if (isNaN(new Date(o.createdAt).getTime())) issues.push("Invalid createdAt");

            if (issues.length > 0) {
                console.error(`Order ID ${o.id}: ISSUES -> ${issues.join(", ")}`);
                console.log(JSON.stringify(o, null, 2));
            }
        }

        console.log("Check complete.");
    } catch (e) {
        console.error("Error checking DB:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
