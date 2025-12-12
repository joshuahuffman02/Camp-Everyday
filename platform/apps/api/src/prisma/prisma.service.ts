import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../api/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const connectionString = process.env.DATABASE_URL || process.env.PLATFORM_DATABASE_URL;
    if (!connectionString) {
      console.error('No DATABASE_URL or PLATFORM_DATABASE_URL found');
    }
    const adapter = new PrismaPg({ connectionString });
    // @ts-ignore Prisma 7 adapter signature
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}

