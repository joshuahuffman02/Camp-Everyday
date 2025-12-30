import { Module, Global } from "@nestjs/common";
import { BullQueueService } from "./bull-queue.service";
import { EmailQueueProcessor } from "./processors/email.processor";
import { WebhookQueueProcessor } from "./processors/webhook.processor";
import { ReportQueueProcessor } from "./processors/report.processor";
import { SyncQueueProcessor } from "./processors/sync.processor";
import { RedisModule } from "../redis/redis.module";

@Global()
@Module({
  imports: [RedisModule],
  providers: [
    BullQueueService,
    EmailQueueProcessor,
    WebhookQueueProcessor,
    ReportQueueProcessor,
    SyncQueueProcessor,
  ],
  exports: [BullQueueService],
})
export class QueueModule {}
