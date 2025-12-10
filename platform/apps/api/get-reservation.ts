import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const reservation = await prisma.reservation.findFirst({
        where: {
            guest: {
                email: 'john.doe@example.com'
            }
        }
    });

    if (reservation) {
        console.log(`RESERVATION_ID: ${reservation.id}`);
        console.log(`CAMPGROUND_ID: ${reservation.campgroundId}`);
    } else {
        console.log('No reservation found for john.doe@example.com');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
