
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const reservation = await prisma.reservation.findFirst({
        include: { guest: true, site: true, campground: true }
    });
    console.log(reservation.id);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
