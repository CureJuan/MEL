import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NetworkModule } from '../networks/network.module';
import {
  ActivityLog,
  ActivityLogSchema,
} from '../common/schema/activityLog.schema';
import { PartnerController } from './partner.controller';
import { PartnerService } from './partner.service';
import { Partner, PartnerSchema } from './schema/partner.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Partner.name, schema: PartnerSchema },
      { name: ActivityLog.name, schema: ActivityLogSchema },
    ]),
    NetworkModule,
  ],
  controllers: [PartnerController],
  providers: [PartnerService],
  exports: [PartnerService],
})
export class PartnerModule {}
