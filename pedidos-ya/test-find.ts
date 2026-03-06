import { prisma } from "./src/lib/prisma";

async function main() {
    try {
        const apps = await prisma.restaurantApplication.findMany();
        console.log("Success! Found", apps.length, "apps");
    } catch (e: any) {
        console.error("Failed:", e.message);
    }
}

main();
