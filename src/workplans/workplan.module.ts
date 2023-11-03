import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MelpModule } from '../melp/melp.module';
import { NetworkModule } from '../networks/network.module';
import { PartnerModule } from '../partners/partners.module';
import { ActivitiesModule } from '../activities/activities.module';
import { UserModule } from '../users/user.module';
import { Workplan, WorkplanSchema } from './schema/workplan.schema';
import {
  WorkplanActivities,
  WorkplanActivitiesSchema,
} from './schema/workplan_activities.schema';
import { WorkplanController } from './workplan.controller';
import { WorkplanService } from './workplan.service';

@Module({
  imports: [
    UserModule,
    ActivitiesModule,
    MelpModule,
    NetworkModule,
    PartnerModule,
    MongooseModule.forFeature([
      { name: Workplan.name, schema: WorkplanSchema },
    ]),
    MongooseModule.forFeature([
      { name: WorkplanActivities.name, schema: WorkplanActivitiesSchema },
    ]),
  ],
  controllers: [WorkplanController],
  providers: [WorkplanService],
  exports: [WorkplanService], // making WorkplanService available outside the Workplan Module.
})
export class WorkplanModule {}
