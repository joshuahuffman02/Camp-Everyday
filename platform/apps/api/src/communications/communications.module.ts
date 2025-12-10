import { Module } from "@nestjs/common";
import { CommunicationsController } from "./communications.controller";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { SmsModule } from "../sms/sms.module";
import { NpsModule } from "../nps/nps.module";
import { PermissionsModule } from "../permissions/permissions.module";

@Module({
  imports: [SmsModule, NpsModule, PermissionsModule],
  controllers: [CommunicationsController],
  providers: [PrismaService, EmailService],
  exports: []
})
export class CommunicationsModule { }

