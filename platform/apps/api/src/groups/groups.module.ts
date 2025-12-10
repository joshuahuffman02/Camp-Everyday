import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GroupsController, BlocksController],
  providers: [GroupsService, BlocksService],
  exports: [GroupsService, BlocksService],
})
export class GroupsModule {}

